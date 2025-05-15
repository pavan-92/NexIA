import OpenAI from "openai";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import DeepgramSDK from '@deepgram/sdk';

// Definindo explicitamente a chave da API OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "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";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Initialize Deepgram client for audio transcription
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
if (!DEEPGRAM_API_KEY) {
  console.error("DEEPGRAM_API_KEY não encontrada nas variáveis de ambiente. A transcrição pode falhar.");
}
const deepgram = new DeepgramSDK.Deepgram(DEEPGRAM_API_KEY);

// Transcribe audio using Deepgram
export async function transcribeAudio(buffer: Buffer): Promise<{ text: string, duration: number }> {
  try {
    if (!buffer || buffer.length === 0) {
      throw new Error("Buffer de áudio vazio ou inválido");
    }
    
    // Verifica o tamanho do buffer
    if (buffer.length < 1024) { // Menos de 1KB é provavelmente inválido
      throw new Error("Arquivo de áudio muito pequeno ou corrompido");
    }
    
    // Imprime informações de debug
    console.log(`Processando arquivo de áudio com Deepgram: ${buffer.length} bytes`);
    
    // Cria um arquivo temporário
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `audio-${Date.now()}.webm`);
    
    // Escreve o buffer no arquivo
    fs.writeFileSync(tempFilePath, buffer);
    
    // Verifica se o arquivo foi criado corretamente
    if (!fs.existsSync(tempFilePath)) {
      throw new Error("Falha ao criar arquivo temporário");
    }
    
    const fileStats = fs.statSync(tempFilePath);
    console.log(`Arquivo temporário criado: ${fileStats.size} bytes`);
    
    // Transcrição com Deepgram
    console.log('Iniciando transcrição com Deepgram...');
    
    // Set transcription options
    const transcriptionOptions = {
      punctuate: true,
      language: "pt-BR",
      model: "general",
      smart_format: true,
      diarize: true,
    };

    // Read file as buffer for Deepgram
    const audioData = fs.readFileSync(tempFilePath);
    
    // Make request to Deepgram
    const response = await deepgram.transcription.preRecorded(
      { buffer: audioData, mimetype: 'audio/webm' },
      transcriptionOptions
    );
    
    // Limpa o arquivo temporário
    try {
      fs.unlinkSync(tempFilePath);
    } catch (cleanupError) {
      console.warn("Erro ao remover arquivo temporário:", cleanupError);
      // Não interrompe o fluxo se não conseguir limpar
    }
    
    // Extract transcript text
    const transcript = response?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    
    if (!transcript) {
      throw new Error("Resposta de transcrição inválida do Deepgram");
    }
    
    console.log('Transcrição concluída com sucesso:', transcript.substring(0, 100) + '...');
    
    // Estima duração com base no número de palavras
    const wordCount = transcript.split(' ').length;
    const estimatedDuration = wordCount * 3; // ~3s por palavra (aproximação)
    
    return {
      text: transcript,
      duration: estimatedDuration,
    };
  } catch (error) {
    console.error("Erro ao transcrever áudio com Deepgram:", error);
    
    // Mensagem de erro mais descritiva
    let errorMessage = "Falha ao transcrever áudio";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
}

// Generate medical notes from transcription
export async function generateMedicalNotes(transcription: string): Promise<{
  patientInfo: {
    fullName: string;
    birthDate: string;
    sex: string;
    cpf: string;
    motherName: string;
    address: string;
  };
  healthcareInfo: {
    cnes: string;
    professionalName: string;
    professionalCNS: string;
    professionalCBO: string;
  };
  consultation: {
    dateTime: string;
    consultationType: string;
    
    // SOAP Format
    subjective: string;
    objective: string;
    assessment: string;
    plan: {
      procedures: string;
      medications: string;
      referrals: string;
      conduct: string;
      followUp: string;
    };
    
    // Campos anteriores para compatibilidade
    chiefComplaint: string;
    anamnesis: string;
    diagnosis: string;
    procedures: string;
    medications: string;
    referrals: string;
    conduct: string;
    clinicalEvolution: string;
    physicalExam: string;
  };
  legalInfo: {
    professionalSignature: string;
    consultationProtocol: string;
    observations: string;
    emotionalObservations: string;
    informedConsent: string;
  };
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um assistente clínico especializado em criar prontuários médicos completos, seguindo o padrão SOAP e incluindo códigos CID-10 para diagnósticos.
          
          Analise a transcrição da consulta médica e gere um prontuário eletrônico estruturado com TODOS os seguintes campos obrigatórios:
          
          1. IDENTIFICAÇÃO DO PACIENTE:
            - Nome completo do paciente
            - Data de nascimento (no formato DD/MM/AAAA)
            - Sexo
            - CPF ou CNS (Cartão Nacional de Saúde)
            - Nome da mãe
            - Endereço completo (CEP, UF, município, logradouro, número)
          
          2. INFORMAÇÕES DA UNIDADE DE SAÚDE:
            - CNES (Código Nacional do Estabelecimento de Saúde)
            - Nome do profissional responsável pelo atendimento
            - CNS do profissional
            - CBO (Código Brasileiro de Ocupações) do profissional
          
          3. DADOS DA CONSULTA NO PADRÃO SOAP:
            - Data e hora do atendimento (DD/MM/AAAA HH:MM)
            - Tipo de atendimento (ex: consulta médica, acolhimento, visita domiciliar)
            
            - S (Subjetivo): Queixa principal/motivo da consulta e informações relatadas pelo paciente
            
            - O (Objetivo): Achados clínicos, sinais vitais, resultados de exames e registro de exame físico
            
            - A (Avaliação): Hipótese diagnóstica com código CID-10 específico (exemplo: "Cefaleia tensional (G44.2)")
            
            - P (Plano): 
              * Procedimentos realizados (com código SIGTAP quando aplicável)
              * Medicamentos prescritos (com dose, posologia e duração)
              * Encaminhamentos realizados
              * Conduta adotada
              * Orientações ao paciente
              * Retorno e acompanhamento
          
          4. DOCUMENTOS E REGISTRO LEGAL:
            - Assinatura digital do profissional
            - Número do atendimento ou protocolo interno
            - Observações adicionais (quando necessário)
            - Observações sobre o estado emocional do paciente
          
          IMPORTANTE:
          - Estruture o documento claramente com as seções SOAP bem definidas
          - Inclua sempre o código CID-10 completo junto ao diagnóstico
          - Para campos com dados pessoais não especificados na transcrição, use informações fictícias IDENTIFICANDO que são ilustrativas
          - Mantenha o formato clínico e profissional
          - Seja detalhado e específico nos campos de anamnese, diagnóstico e conduta
          - Inclua TODOS os campos acima no formato JSON solicitado, mesmo que tenha que usar dados ilustrativos
          - Responda APENAS com os dados estruturados no formato JSON solicitado
          
          Use EXATAMENTE o seguinte formato JSON em sua resposta:`
        },
        {
          role: "user",
          content: transcription + "\n\nGere um prontuário eletrônico completo em formato JSON com todos os campos obrigatórios conforme a estrutura especificada:"
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      patientInfo: {
        fullName: result.patientInfo?.fullName || "Nome não informado",
        birthDate: result.patientInfo?.birthDate || "Data não informada",
        sex: result.patientInfo?.sex || "Não informado",
        cpf: result.patientInfo?.cpf || "Não informado",
        motherName: result.patientInfo?.motherName || "Não informado",
        address: result.patientInfo?.address || "Não informado"
      },
      healthcareInfo: {
        cnes: result.healthcareInfo?.cnes || "Não informado",
        professionalName: result.healthcareInfo?.professionalName || "Não informado",
        professionalCNS: result.healthcareInfo?.professionalCNS || "Não informado",
        professionalCBO: result.healthcareInfo?.professionalCBO || "Não informado"
      },
      consultation: {
        dateTime: result.consultation?.dateTime || new Date().toLocaleString('pt-BR'),
        consultationType: result.consultation?.consultationType || "Consulta médica",
        
        // SOAP Format
        subjective: result.consultation?.subjective || result.consultation?.chiefComplaint || "Não informado",
        objective: result.consultation?.objective || result.consultation?.physicalExam || "Não informado",
        assessment: result.consultation?.assessment || result.consultation?.diagnosis || "Não informado",
        plan: {
          procedures: result.consultation?.plan?.procedures || result.consultation?.procedures || "Não informado",
          medications: result.consultation?.plan?.medications || result.consultation?.medications || "Não informado",
          referrals: result.consultation?.plan?.referrals || result.consultation?.referrals || "Não informado",
          conduct: result.consultation?.plan?.conduct || result.consultation?.conduct || "Não informado",
          followUp: result.consultation?.plan?.followUp || "Não informado"
        },
        
        // Mantemos os campos antigos para compatibilidade
        chiefComplaint: result.consultation?.chiefComplaint || "Não informado",
        anamnesis: result.consultation?.anamnesis || "Não informado",
        diagnosis: result.consultation?.diagnosis || "Não informado",
        procedures: result.consultation?.procedures || "Não informado",
        medications: result.consultation?.medications || "Não informado",
        referrals: result.consultation?.referrals || "Não informado",
        conduct: result.consultation?.conduct || "Não informado",
        clinicalEvolution: result.consultation?.clinicalEvolution || "Não informado",
        physicalExam: result.consultation?.physicalExam || "Não informado"
      },
      legalInfo: {
        professionalSignature: result.legalInfo?.professionalSignature || "Documento pendente de assinatura digital",
        consultationProtocol: result.legalInfo?.consultationProtocol || `PROT-${Date.now()}`,
        observations: result.legalInfo?.observations || "",
        emotionalObservations: result.legalInfo?.emotionalObservations || "",
        informedConsent: result.legalInfo?.informedConsent || "Consentimento informado obtido verbalmente"
      }
    };
  } catch (error) {
    console.error("Error generating medical notes:", error);
    throw new Error("Failed to generate medical notes");
  }
}



// Translate text from English to Portuguese
export async function translateText(content: {
  title?: string;
  abstract?: string;
}): Promise<{
  title?: string;
  abstract?: string;
}> {
  try {
    // Skip if content is empty
    if (!content.title && !content.abstract) {
      return content;
    }

    // Create prompt for translation
    const titleText = content.title || "";
    const abstractText = content.abstract || "";
    
    const prompt = `
Traduza do inglês para o português o conteúdo a seguir. Mantenha termos médicos técnicos intactos quando necessário.

TÍTULO: ${titleText}
RESUMO: ${abstractText.substring(0, 1000)}
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "Você é um tradutor médico especializado em traduzir artigos científicos do inglês para o português. Mantenha a tradução precisa mas adaptada para a compreensão em português. Use exatamente este formato em sua resposta:\n\nTÍTULO TRADUZIDO: [título traduzido]\n\nRESUMO TRADUZIDO: [resumo traduzido]" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    });

    // Extract response
    const translationText = response.choices[0]?.message.content || "";
    
    // Parse translated content
    let translatedTitle = content.title;
    let translatedAbstract = content.abstract;
    
    if (translationText.includes("TÍTULO TRADUZIDO:")) {
      const parts = translationText.split("TÍTULO TRADUZIDO:");
      if (parts.length > 1) {
        const titlePart = parts[1];
        if (titlePart.includes("RESUMO TRADUZIDO:")) {
          translatedTitle = titlePart.split("RESUMO TRADUZIDO:")[0].trim();
          translatedAbstract = titlePart.split("RESUMO TRADUZIDO:")[1].trim();
        } else {
          translatedTitle = titlePart.trim();
        }
      }
    }
    
    return {
      title: translatedTitle,
      abstract: translatedAbstract
    };
  } catch (error) {
    console.error("Erro na tradução:", error);
    return content; // Return original content on error
  }
}

export default openai;
