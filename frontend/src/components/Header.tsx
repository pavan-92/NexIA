import React from 'react';
import { Link } from 'wouter';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b shadow-sm">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <Link href="/">
          <a className="flex items-center gap-2">
            <img src="/logo.png" alt="NexIA Logo" className="h-8" />
            <h1 className="text-2xl font-bold text-blue-600">NexIA</h1>
          </a>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#funcionalidades">
            <a className="text-gray-600 hover:text-blue-600 transition-colors">
              Funcionalidades
            </a>
          </Link>
          <Link href="/#precos">
            <a className="text-gray-600 hover:text-blue-600 transition-colors">
              Preços
            </a>
          </Link>
          <Link href="/#contato">
            <a className="text-gray-600 hover:text-blue-600 transition-colors">
              Contato
            </a>
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <Link href="/login">
            <a className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
              Entrar
            </a>
          </Link>
          <Link href="/register">
            <a className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Cadastrar
            </a>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;