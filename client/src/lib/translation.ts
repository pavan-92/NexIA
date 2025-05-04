import OpenAI from "openai";
import { PubMedArticle } from "./pubmed";

// Inicializa o cliente OpenAI
const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Permite uso no browser (em produção, isso deveria ser feito no servidor)
});

/**
 * Traduz o título e resumo de um artigo do PubMed
 */
export async function translateArticle(article: PubMedArticle): Promise<PubMedArticle> {
  try {
    // Prepara o texto para tradução
    const titleToTranslate = article.title;
    const abstractToTranslate = article.abstract || "";
    
    if (!titleToTranslate && !abstractToTranslate) {
      return article;
    }
    
    // Monta o prompt para a tradução
    const prompt = `
Traduza do inglês para o português o conteúdo a seguir. Mantenha termos médicos técnicos intactos quando necessário.

TÍTULO: ${titleToTranslate}
RESUMO: ${abstractToTranslate.substring(0, 1000)}
`;

    // Faz a chamada para a API do OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // o modelo mais recente da OpenAI é "gpt-4o", lançado após maio 2024
      messages: [
        { 
          role: "system", 
          content: "Você é um tradutor médico especializado em traduzir artigos científicos do inglês para o português. Mantenha a tradução precisa mas adaptada para a compreensão em português. Use exatamente este formato em sua resposta:\n\nTÍTULO TRADUZIDO: [título traduzido]\n\nRESUMO TRADUZIDO: [resumo traduzido]" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3, // Baixa temperatura para manter a tradução mais precisa
      max_tokens: 1500
    });

    // Extrai a resposta
    const translationText = response.choices[0]?.message.content || "";
    
    // Extrai título e resumo da resposta utilizando split simples
    let translatedTitle = article.title;
    let translatedAbstract = article.abstract;
    
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
    
    // Retorna o artigo com o título e resumo traduzidos
    return {
      ...article,
      title: translatedTitle,
      abstract: translatedAbstract
    };
  } catch (error) {
    console.error("Erro na tradução:", error);
    // Em caso de erro, retorna o artigo original
    return article;
  }
}

/**
 * Traduz uma lista de artigos do PubMed
 */
export async function translateArticles(articles: PubMedArticle[]): Promise<PubMedArticle[]> {
  // Traduz em paralelo (no máximo 3 por vez para não sobrecarregar a API)
  const translateBatch = async (batch: PubMedArticle[]) => {
    return await Promise.all(batch.map(article => translateArticle(article)));
  };
  
  // Divide os artigos em lotes de 3
  const batches: PubMedArticle[][] = [];
  for (let i = 0; i < articles.length; i += 3) {
    batches.push(articles.slice(i, i + 3));
  }
  
  // Processa cada lote sequencialmente
  let translatedArticles: PubMedArticle[] = [];
  for (const batch of batches) {
    const translatedBatch = await translateBatch(batch);
    translatedArticles = [...translatedArticles, ...translatedBatch];
  }
  
  return translatedArticles;
}