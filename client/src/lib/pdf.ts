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
    const textLines = doc.splitTextToSize(content, pageWidth - 30);
    doc.text(textLines, 15, startY + 7);
    
    return startY + 7 + (textLines.length * 7);
  };
  
  let currentY = 113;
  
  if (consultation.notes.chiefComplaint) {
    currentY = addSection('Queixa Principal', consultation.notes.chiefComplaint, currentY);
  }
  
  if (consultation.notes.history) {
    currentY = addSection('História da Moléstia Atual', consultation.notes.history, currentY + 5);
  }
  
  if (consultation.notes.diagnosis) {
    currentY = addSection('Hipótese Diagnóstica', consultation.notes.diagnosis, currentY + 5);
  }
  
  if (consultation.notes.plan) {
    currentY = addSection('Conduta', consultation.notes.plan, currentY + 5);
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
