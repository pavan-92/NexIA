import React from 'react';
import Layout from '../components/Layout';
import { Link } from 'wouter';

const Home: React.FC = () => {
  return (
    <Layout>
      <section className="bg-gradient-to-r from-blue-500 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Frontend NexIA funcionando com sucesso
          </h2>
          <p className="text-xl mb-8">
            A NexIA transforma sua fala em prontuários completos sem digitação, eliminando a burocracia e devolvendo seu tempo para o que realmente importa: o paciente.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <div className="inline-block px-6 py-3 bg-white text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors cursor-pointer">
                Comece Agora
              </div>
            </Link>
            <Link href="/test">
              <div className="inline-block px-6 py-3 bg-blue-600 border border-white text-white rounded-md font-medium hover:bg-blue-700 transition-colors cursor-pointer">
                Ver Página de Teste
              </div>
            </Link>
          </div>
        </div>
      </section>
      
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-12">Como a NexIA funciona</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="bg-blue-50 p-6 rounded-lg">
                <div className="text-blue-600 font-bold text-xl mb-2">Passo {step}</div>
                <p>Descrição do passo {step} do processo de utilização da plataforma NexIA.</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;