import { jsPDF } from 'jspdf';
import { Consultation, Patient } from '@/types';
import { formatDate, formatDateTime } from './utils';

// Function to generate PDF from consultation data
export const generatePDF = (consultation: Consultation, patient: Patient): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add header with logo
  doc.setFontSize(22);
  doc.setTextColor(10, 179, 184); // Primary color
  doc.text('NexIA', 15, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Prontuário Gerado por IA', pageWidth - 70, 20);
  
  // Add line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 25, pageWidth - 15, 25);
  
  // Add patient information
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text('Dados do Paciente', 15, 35);
  
  doc.setFontSize(12);
  doc.text(`Nome: ${patient.name}`, 15, 45);
  doc.text(`Data de Nascimento: ${formatDate(patient.birthDate)}`, 15, 52);
  doc.text(`Gênero: ${patient.gender}`, 15, 59);
  doc.text(`Contato: ${patient.contact}`, 15, 66);
  
  // Add consultation information
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text('Dados da Consulta', 15, 76);
  
  doc.setFontSize(12);
  doc.text(`Data: ${formatDateTime(consultation.date)}`, 15, 86);
  doc.text(`Médico: ${consultation.doctorName}`, 15, 93);
  
  // Add medical record
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text('Prontuário Médico', 15, 103);
  
  // Format medical record sections
  const addSection = (title: string, content: string, startY: number): number => {
    doc.setFontSize(12);
    doc.setTextColor(10, 179, 184);
    doc.text(title, 15, startY);
    
    doc.setTextColor(30, 30, 30);
    const textLines = doc.splitTextToSize(content || "Não informado", pageWidth - 30);
    doc.text(textLines, 15, startY + 7);
    
    return startY + 7 + (textLines.length * 7);
  };
  
  let currentY = 113;
  
  // Section 1: Patient Info
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text('1. IDENTIFICAÇÃO DO PACIENTE', 15, currentY);
  currentY += 10;
  
  if (consultation.notes?.patientInfo) {
    const patientInfo = consultation.notes.patientInfo;
    doc.setFontSize(11);
    doc.text(`Nome completo: ${patientInfo.fullName || patient.name}`, 15, currentY);
    currentY += 7;
    doc.text(`Data de nascimento: ${patientInfo.birthDate || formatDate(patient.birthDate)}`, 15, currentY);
    currentY += 7;
    doc.text(`Sexo: ${patientInfo.sex || patient.gender || "Não informado"}`, 15, currentY);
    currentY += 7;
    doc.text(`CPF/CNS: ${patientInfo.cpf || patient.cpf || "Não informado"}`, 15, currentY);
    currentY += 7;
    doc.text(`Nome da mãe: ${patientInfo.motherName || patient.motherName || "Não informado"}`, 15, currentY);
    currentY += 7;
    doc.text(`Endereço: ${patientInfo.address || patient.address || "Não informado"}`, 15, currentY);
    currentY += 15;
  }
  
  // Section 2: Healthcare Facility Info
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text('2. INFORMAÇÕES DA UNIDADE DE SAÚDE', 15, currentY);
  currentY += 10;
  
  if (consultation.notes?.healthcareInfo) {
    const healthcareInfo = consultation.notes.healthcareInfo;
    doc.setFontSize(11);
    doc.text(`CNES: ${healthcareInfo.cnes || "Não informado"}`, 15, currentY);
    currentY += 7;
    doc.text(`Profissional: ${healthcareInfo.professionalName || consultation.doctorName}`, 15, currentY);
    currentY += 7;
    doc.text(`CNS do profissional: ${healthcareInfo.professionalCNS || "Não informado"}`, 15, currentY);
    currentY += 7;
    doc.text(`CBO do profissional: ${healthcareInfo.professionalCBO || "Não informado"}`, 15, currentY);
    currentY += 15;
  }
  
  // Section 3: Consultation Data (SOAP Format)
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text('3. DADOS DA CONSULTA (SOAP)', 15, currentY);
  currentY += 10;
  
  if (consultation.notes?.consultation) {
    const consultData = consultation.notes.consultation;
    
    // Check if we need to add a new page before consultation details
    if (currentY > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      currentY = 20;
    }
    
    // Data básica da consulta
    currentY = addSection('Data e hora', consultData.dateTime || formatDateTime(consultation.date), currentY);
    currentY = addSection('Tipo de atendimento', consultData.consultationType || "Consulta médica", currentY + 5);
    
    // Add a new page if needed
    if (currentY > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      currentY = 20;
    }
    
    // S - Subjetivo
    doc.setFontSize(12);
    doc.setTextColor(0, 102, 204); // Azul para Subjetivo
    doc.text('S - SUBJETIVO', 15, currentY + 7);
    currentY += 12;
    
    // Usar o campo subjective ou chiefComplaint+anamnesis para compatibilidade
    const subjetivo = consultData.subjective || 
      `${consultData.chiefComplaint ? `Queixa principal: ${consultData.chiefComplaint}\n` : ''}${consultData.anamnesis || ''}`;
    
    doc.setTextColor(30, 30, 30);
    const subjLines = doc.splitTextToSize(subjetivo || "Não informado", pageWidth - 30);
    doc.text(subjLines, 15, currentY);
    currentY += (subjLines.length * 7) + 10;
    
    if (currentY > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      currentY = 20;
    }
    
    // O - Objetivo
    doc.setFontSize(12);
    doc.setTextColor(0, 153, 51); // Verde para Objetivo
    doc.text('O - OBJETIVO', 15, currentY);
    currentY += 12;
    
    // Usar o campo objective ou physicalExam para compatibilidade
    const objetivo = consultData.objective || consultData.physicalExam || "";
    
    doc.setTextColor(30, 30, 30);
    const objLines = doc.splitTextToSize(objetivo || "Não informado", pageWidth - 30);
    doc.text(objLines, 15, currentY);
    currentY += (objLines.length * 7) + 10;
    
    if (currentY > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      currentY = 20;
    }
    
    // A - Avaliação
    doc.setFontSize(12);
    doc.setTextColor(204, 153, 0); // Âmbar para Avaliação
    doc.text('A - AVALIAÇÃO', 15, currentY);
    currentY += 12;
    
    // Usar o campo assessment ou diagnosis para compatibilidade
    const avaliacao = consultData.assessment || consultData.diagnosis || "";
    
    doc.setTextColor(30, 30, 30);
    const avalLines = doc.splitTextToSize(avaliacao || "Não informado", pageWidth - 30);
    doc.text(avalLines, 15, currentY);
    currentY += (avalLines.length * 7) + 10;
    
    if (currentY > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      currentY = 20;
    }
    
    // P - Plano
    doc.setFontSize(12);
    doc.setTextColor(204, 51, 0); // Vermelho para Plano
    doc.text('P - PLANO', 15, currentY);
    currentY += 12;
    
    // Verificar se existe estrutura plan ou usar os campos antigos para compatibilidade
    if (consultData.plan) {
      // Novo formato com estrutura de plano
      const plan = consultData.plan;
      
      if (plan.procedures) {
        currentY = addSection('Procedimentos realizados', plan.procedures, currentY);
      }
      
      if (currentY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        currentY = 20;
      }
      
      if (plan.medications) {
        currentY = addSection('Medicamentos prescritos', plan.medications, currentY + 5);
      }
      
      if (currentY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        currentY = 20;
      }
      
      if (plan.referrals) {
        currentY = addSection('Encaminhamentos', plan.referrals, currentY + 5);
      }
      
      if (currentY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        currentY = 20;
      }
      
      if (plan.conduct) {
        currentY = addSection('Conduta', plan.conduct, currentY + 5);
      }
      
      if (currentY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        currentY = 20;
      }
      
      if (plan.followUp) {
        currentY = addSection('Acompanhamento e retorno', plan.followUp, currentY + 5);
      }
    } else {
      // Formato antigo para compatibilidade
      if (consultData.procedures) {
        currentY = addSection('Procedimentos realizados', consultData.procedures, currentY);
      }
      
      if (currentY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        currentY = 20;
      }
      
      if (consultData.medications) {
        currentY = addSection('Medicamentos prescritos', consultData.medications, currentY + 5);
      }
      
      if (currentY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        currentY = 20;
      }
      
      if (consultData.referrals) {
        currentY = addSection('Encaminhamentos', consultData.referrals, currentY + 5);
      }
      
      if (currentY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        currentY = 20;
      }
      
      if (consultData.conduct) {
        currentY = addSection('Conduta adotada', consultData.conduct, currentY + 5);
      }
      
      if (currentY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        currentY = 20;
      }
      
      if (consultData.clinicalEvolution) {
        currentY = addSection('Evolução clínica', consultData.clinicalEvolution, currentY + 5);
      }
    }
  }
  
  // Section 4: Legal Documents
  if (currentY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 10;
  }
  
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text('4. DOCUMENTOS E REGISTRO LEGAL', 15, currentY);
  currentY += 10;
  
  if (consultation.notes?.legalInfo) {
    const legalInfo = consultation.notes.legalInfo;
    doc.setFontSize(11);
    doc.text(`Assinatura digital: ${legalInfo.professionalSignature || "Documento pendente de assinatura digital"}`, 15, currentY);
    currentY += 7;
    doc.text(`Protocolo interno: ${legalInfo.consultationProtocol || ""}`, 15, currentY);
    currentY += 7;
    
    if (legalInfo.observations) {
      doc.text(`Observações: ${legalInfo.observations}`, 15, currentY);
      currentY += 7;
    }
    
    doc.text(`Consentimento informado: ${legalInfo.informedConsent || "Consentimento informado obtido verbalmente"}`, 15, currentY);
  }
  
  // Add footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado por NexIA em ${formatDateTime(new Date())}`, 15, doc.internal.pageSize.getHeight() - 10);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 40, doc.internal.pageSize.getHeight() - 10);
  }
  
  // Save the document
  doc.save(`nexia_${patient.name.replace(/\s+/g, '_')}_${formatDate(consultation.date).replace(/\//g, '-')}.pdf`);
};
