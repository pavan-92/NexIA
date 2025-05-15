import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes CSS com clsx e tailwind-merge
 * @param inputs Classes CSS a serem combinadas
 * @returns String de classes CSS combinadas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata uma data para exibição amigável
 * @param date Data a ser formatada
 * @param locale Localização para formatação (padrão: pt-BR)
 * @returns String com a data formatada
 */
export function formatDate(date: Date | string, locale = 'pt-BR'): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj);
}

/**
 * Formata um CPF com máscara
 * @param cpf String do CPF sem formatação
 * @returns CPF formatado (ex: 123.456.789-00)
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) {
    return cpf;
  }
  
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata um telefone com máscara
 * @param phone String do telefone sem formatação
 * @returns Telefone formatado (ex: (11) 98765-4321)
 */
export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length < 10) {
    return phone;
  }
  
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

/**
 * Trunca um texto para um tamanho máximo
 * @param text Texto a ser truncado
 * @param maxLength Tamanho máximo (padrão: 100)
 * @returns Texto truncado com reticências, se necessário
 */
export function truncateText(text: string, maxLength = 100): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength) + '...';
}

/**
 * Recupera o primeiro erro de um objeto de erros do React Hook Form
 * @param errors Objeto de erros do React Hook Form
 * @returns Mensagem do primeiro erro encontrado ou string vazia
 */
export function getFirstError(errors: Record<string, any>): string {
  if (!errors) return '';
  
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return '';
  
  const error = errors[firstKey];
  return error?.message || '';
}

/**
 * Gera um ID único baseado em timestamp e número aleatório
 * @returns String de ID único
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Calcula a idade a partir da data de nascimento
 * @param birthDate Data de nascimento
 * @returns Idade em anos
 */
export function calculateAge(birthDate: Date | string): number {
  const today = new Date();
  const birthDateObj = birthDate instanceof Date ? birthDate : new Date(birthDate);
  
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = today.getMonth() - birthDateObj.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }
  
  return age;
}