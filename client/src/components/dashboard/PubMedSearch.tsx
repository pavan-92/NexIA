import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, Search, ExternalLink, Loader2, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { searchPubMed, fetchArticleAbstract, type PubMedArticle } from "@/lib/pubmed";
import { useToast } from "@/hooks/use-toast";

export default function PubMedSearch() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [articles, setArticles] = useState<PubMedArticle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [abstract, setAbstract] = useState<string | null>(null);
  const [isLoadingAbstract, setIsLoadingAbstract] = useState<boolean>(false);
  
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setError("Digite um termo de busca");
      return;
    }
    
    setIsSearching(true);
    setError(null);
    setArticles([]);
    setExpandedArticleId(null);
    setAbstract(null);
    
    try {
      const results = await searchPubMed(searchTerm);
      setArticles(results);
      
      if (results.length === 0) {
        setError("Nenhum resultado encontrado para este termo");
      }
    } catch (err) {
      console.error("Erro na busca:", err);
      setError("Não foi possível realizar a busca. Tente novamente.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleExpandArticle = async (pmid: string) => {
    if (expandedArticleId === pmid) {
      setExpandedArticleId(null);
      setAbstract(null);
      return;
    }
    
    setExpandedArticleId(pmid);
    setIsLoadingAbstract(true);
    setAbstract(null);
    
    try {
      const abstractText = await fetchArticleAbstract(pmid);
      setAbstract(abstractText);
    } catch (err) {
      console.error("Erro ao buscar resumo:", err);
      setAbstract("Não foi possível carregar o resumo deste artigo.");
    } finally {
      setIsLoadingAbstract(false);
    }
  };

  const handleExportArticle = (article: PubMedArticle) => {
    // Gera uma citação do artigo
    const citation = `${article.authors}. ${article.title}. ${article.journal}. ${article.publicationDate}. PMID: ${article.pmid}${article.doi ? ` DOI: ${article.doi}` : ''}.`;
    
    // Copia para a área de transferência
    navigator.clipboard.writeText(citation)
      .then(() => {
        toast({
          title: "Citação copiada",
          description: "A citação do artigo foi copiada para a área de transferência",
        });
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Erro ao copiar",
          description: "Não foi possível copiar a citação para a área de transferência",
        });
      });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="Digite o termo de busca"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isSearching}
        >
          {isSearching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Buscar
        </Button>
      </form>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {articles.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          {articles.map((article) => (
            <Card 
              key={article.pmid}
              className="p-4 hover:border-blue-200 transition-all"
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <h3 className="font-medium text-gray-800">{article.title}</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                      onClick={() => handleExportArticle(article)}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Exportar citação</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                      onClick={() => window.open(article.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">Abrir artigo</span>
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  {article.authors}
                </div>
                
                <div className="text-sm">
                  <span className="text-blue-600">{article.journal}</span> • {article.publicationDate}
                </div>
                
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleExpandArticle(article.pmid)}
                    className="text-xs h-7 text-blue-600 border-blue-100 hover:bg-blue-50"
                  >
                    {expandedArticleId === article.pmid ? "Ocultar resumo" : "Ver resumo"}
                  </Button>
                  
                  {expandedArticleId === article.pmid && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
                      {isLoadingAbstract ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
                        </div>
                      ) : (
                        <p className="text-gray-700">{abstract}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </motion.div>
      )}
      
      {isSearching && (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Buscando artigos...</p>
          </div>
        </div>
      )}
    </div>
  );
}