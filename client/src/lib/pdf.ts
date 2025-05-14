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
  
  // Section 3: Consultation Data
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text('3. DADOS DA CONSULTA', 15, currentY);
  currentY += 10;
  
  if (consultation.notes?.consultation) {
    const consultData = consultation.notes.consultation;
    
    // Check if we need to add a new page before consultation details
    if (currentY > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      currentY = 20;
    }
    
    currentY = addSection('Data e hora', consultData.dateTime || formatDateTime(consultation.date), currentY);
    currentY = addSection('Tipo de atendimento', consultData.consultationType || "Consulta médica", currentY + 5);
    currentY = addSection('Queixa principal', consultData.chiefComplaint || "", currentY + 5);
    
    // Add a new page if needed
    if (currentY > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      currentY = 20;
    }
    
    currentY = addSection('Anamnese', consultData.anamnesis || "", currentY + 5);
    
    if (currentY > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      currentY = 20;
    }
    
    currentY = addSection('Hipótese diagnóstica', consultData.diagnosis || "", currentY + 5);
    currentY = addSection('Procedimentos realizados', consultData.procedures || "", currentY + 5);
    
    if (currentY > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      currentY = 20;
    }
    
    currentY = addSection('Medicamentos prescritos', consultData.medications || "", currentY + 5);
    currentY = addSection('Encaminhamentos', consultData.referrals || "", currentY + 5);
    
    if (currentY > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      currentY = 20;
    }
    
    currentY = addSection('Conduta adotada', consultData.conduct || "", currentY + 5);
    currentY = addSection('Evolução clínica', consultData.clinicalEvolution || "", currentY + 5);
    
    if (currentY > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      currentY = 20;
    }
    
    currentY = addSection('Exame físico', consultData.physicalExam || "", currentY + 5);
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
