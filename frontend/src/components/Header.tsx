import React from 'react';
import { Link } from 'wouter';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b shadow-sm">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <img src="/logo.png" alt="NexIA Logo" className="h-8" />
            <h1 className="text-2xl font-bold text-blue-600">NexIA</h1>
          </div>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#funcionalidades">
            <div className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer">
              Funcionalidades
            </div>
          </Link>
          <Link href="/#precos">
            <div className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer">
              Preços
            </div>
          </Link>
          <Link href="/#contato">
            <div className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer">
              Contato
            </div>
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <Link href="/login">
            <div className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer">
              Entrar
            </div>
          </Link>
          <Link href="/register">
            <div className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
              Cadastrar
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;