import React from 'react';
import { Switch, Route, useLocation } from 'wouter';
import Home from './pages/Home';

const App: React.FC = () => {
  return (
    <div className="app">
      <Switch>
        <Route path="/" component={Home} />
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