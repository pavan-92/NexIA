import React from 'react';
import Layout from '../components/Layout';

const Test: React.FC = () => {
  return (
    <Layout>
      <div className="p-8">
        <div className="container mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-blue-600 mb-6">
              Frontend NexIA funcionando com sucesso!
            </h1>
            
            <p className="mb-4">
              Esta é uma página de teste que confirma que a estrutura do frontend React foi 
              configurada corretamente com:
            </p>
            
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>React com TypeScript</li>
              <li>Vite como bundler</li>
              <li>Tailwind CSS para estilização</li>
              <li>Wouter para roteamento</li>
              <li>Estrutura organizada de componentes e páginas</li>
            </ul>
            
            <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
              <h2 className="text-lg font-semibold mb-2">Próximos passos:</h2>
              <ol className="list-decimal pl-6 space-y-1">
                <li>Adicionar mais páginas conforme necessário</li>
                <li>Implementar a integração com o backend</li>
                <li>Configurar estados globais e contextos</li>
                <li>Desenvolver formulários e validações</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Test;