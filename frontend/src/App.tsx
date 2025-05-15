import React from 'react';
import { Switch, Route, useLocation } from 'wouter';

// Esta é uma versão simplificada do App.tsx, apenas para estruturar a aplicação
// Componentes reais seriam importados aqui

const App: React.FC = () => {
  return (
    <div className="app">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={PlaceholderPage} />
        <Route path="/register" component={PlaceholderPage} />
        <Route path="/dashboard" component={PlaceholderPage} />
        <Route path="/patients" component={PlaceholderPage} />
        <Route path="/patients/new" component={PlaceholderPage} />
        <Route path="/patients/:id" component={PlaceholderPage} />
        <Route path="/consultation/:patientId" component={PlaceholderPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </div>
  );
};

// Componentes placeholder para a estrutura inicial
const HomePage: React.FC = () => (
  <div className="min-h-screen flex flex-col">
    <header className="bg-white border-b">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">NexIA</h1>
        <nav>
          <a href="/login" className="px-4 py-2 rounded-md text-blue-600 hover:bg-blue-50">
            Entrar
          </a>
        </nav>
      </div>
    </header>
    <main className="flex-grow">
      <section className="bg-gradient-to-r from-blue-500 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Médico no comando do cuidado, IA no controle da burocracia
          </h2>
          <p className="text-xl mb-8">
            A NexIA transforma sua fala em prontuários completos sem digitação, eliminando a burocracia e devolvendo seu tempo para o que realmente importa: o paciente.
          </p>
          <a
            href="/register"
            className="inline-block px-6 py-3 bg-white text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors"
          >
            Comece Agora
          </a>
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
    </main>
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <p className="text-center">© 2025 NexIA. Todos os direitos reservados.</p>
      </div>
    </footer>
  </div>
);

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center flex-col">
    <h1 className="text-4xl font-bold mb-4">404</h1>
    <p className="mb-6">Página não encontrada</p>
    <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md">
      Voltar para a página inicial
    </a>
  </div>
);

const PlaceholderPage: React.FC = () => {
  const [location] = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center flex-col">
      <h1 className="text-2xl font-bold mb-4">Página: {location}</h1>
      <p className="mb-6">Esta página seria implementada em um projeto completo</p>
      <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md">
        Voltar para a página inicial
      </a>
    </div>
  );
};

export default App;