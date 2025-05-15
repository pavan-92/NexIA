// PubMed API Utility Functions
// Baseado na documentação: https://www.ncbi.nlm.nih.gov/books/NBK25497/

// Base URLs para a E-utility API do PubMed 
const ESEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const ESUMMARY_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
const EFETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  publicationDate: string;
  abstract?: string;
  doi?: string;
  url: string;
}

// Busca artigos no PubMed com base no termo de busca
export async function searchPubMed(searchTerm: string, maxResults: number = 5): Promise<PubMedArticle[]> {
  try {
    // Primeiro, usamos eSearch para obter os IDs dos artigos
    const searchParams = new URLSearchParams({
      db: 'pubmed',
      term: searchTerm,
      retmode: 'json',
      retmax: maxResults.toString(),
      usehistory: 'y'
    });
    
    const searchUrl = `${ESEARCH_URL}?${searchParams.toString()}`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      throw new Error(`Erro na busca: ${searchResponse.statusText}`);
    }
    
    const searchData = await searchResponse.json();
    const idList = searchData.esearchresult.idlist;
    
    if (!idList || idList.length === 0) {
      return [];
    }
    
    // Em seguida, usamos eSummary para obter os detalhes dos artigos
    const summaryParams = new URLSearchParams({
      db: 'pubmed',
      id: idList.join(','),
      retmode: 'json'
    });
    
    const summaryUrl = `${ESUMMARY_URL}?${summaryParams.toString()}`;
    const summaryResponse = await fetch(summaryUrl);
    
    if (!summaryResponse.ok) {
      throw new Error(`Erro ao buscar detalhes: ${summaryResponse.statusText}`);
    }
    
    const summaryData = await summaryResponse.json();
    
    // Transformar a resposta em um formato mais amigável
    const articles: PubMedArticle[] = idList.map((id: string) => {
      const article = summaryData.result[id];
      
      if (!article) {
        return null;
      }
      
      // Extrair os autores
      let authors = '';
      if (article.authors && article.authors.length > 0) {
        authors = article.authors
          .map((author: any) => `${author.name}`)
          .join(', ');
      }
      
      // Construir a URL para o artigo no PubMed
      const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${id}/`;
      
      // Formatar o título (remover tags HTML)
      const title = article.title ? article.title.replace(/<[^>]*>/g, '') : 'Sem título';
      
      return {
        pmid: id,
        title,
        authors,
        journal: article.fulljournalname || article.source || 'Desconhecido',
        publicationDate: article.pubdate || 'Data desconhecida',
        abstract: article.description || '',
        doi: article.articleids?.find((idObj: any) => idObj.idtype === 'doi')?.value || '',
        url: pubmedUrl
      };
    }).filter(Boolean);
    
    return articles;
  } catch (error) {
    console.error('Erro ao buscar no PubMed:', error);
    throw error;
  }
}

// Busca o resumo (abstract) completo de um artigo específico
export async function fetchArticleAbstract(pmid: string): Promise<string> {
  try {
    const params = new URLSearchParams({
      db: 'pubmed',
      id: pmid,
      retmode: 'xml',
      rettype: 'abstract'
    });
    
    const fetchUrl = `${EFETCH_URL}?${params.toString()}`;
    const response = await fetch(fetchUrl);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar resumo: ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    
    // Extração simples do resumo do XML (uma abordagem mais robusta usaria um parser XML)
    const abstractMatch = xmlText.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/i);
    
    if (abstractMatch && abstractMatch[1]) {
      return abstractMatch[1].trim();
    } else {
      return 'Resumo não disponível';
    }
  } catch (error) {
    console.error('Erro ao buscar resumo do artigo:', error);
    return 'Erro ao carregar o resumo';
  }
}