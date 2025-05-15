#!/bin/bash

# Cores para mensagens
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Iniciando Frontend NexIA ===${NC}"

# Verifica se o diretório frontend existe
if [ ! -d "frontend" ]; then
  echo -e "${RED}Erro: Diretório 'frontend' não encontrado!${NC}"
  exit 1
fi

# Navega para o diretório frontend
cd frontend

# Verifica se o package.json existe
if [ ! -f "package.json" ]; then
  echo -e "${RED}Erro: Arquivo package.json não encontrado no diretório frontend!${NC}"
  exit 1
fi

# Instala as dependências se node_modules não existir
if [ ! -d "node_modules" ]; then
  echo -e "${GREEN}Instalando dependências do frontend...${NC}"
  npm install
fi

# Inicia o servidor de desenvolvimento
echo -e "${GREEN}Iniciando servidor de desenvolvimento Vite...${NC}"
npm run dev