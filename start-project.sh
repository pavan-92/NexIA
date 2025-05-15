#!/bin/bash

# Script para iniciar os serviços do projeto NexIA

echo "=== Iniciando o Projeto NexIA ==="
echo ""
echo "Verificando estrutura de diretórios..."

# Verificar se os diretórios existem
if [ ! -d "backend" ]; then
  echo "❌ Diretório 'backend' não encontrado!"
  exit 1
fi

if [ ! -d "frontend" ]; then
  echo "❌ Diretório 'frontend' não encontrado!"
  exit 1
fi

# Verificar se os package.json existem
if [ ! -f "backend/package.json" ]; then
  echo "❌ Arquivo 'backend/package.json' não encontrado!"
  exit 1
fi

if [ ! -f "frontend/package.json" ]; then
  echo "❌ Arquivo 'frontend/package.json' não encontrado!"
  exit 1
fi

echo "✅ Estrutura de diretórios verificada!"

# Iniciar o backend
echo ""
echo "=== Iniciando o Backend (porta 3000) ==="
cd backend
npm install &
BACKEND_PID=$!
echo "⏳ Instalando dependências do backend..."
wait $BACKEND_PID
echo "✅ Dependências do backend instaladas!"

# Criar arquivo .env a partir do .env.example se não existir
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "⏳ Criando arquivo .env a partir do .env.example..."
  cp .env.example .env
  echo "✅ Arquivo .env criado!"
fi

# Iniciar o frontend em um novo terminal
echo ""
echo "=== Iniciando o Frontend (porta 5173) ==="
cd ../frontend
npm install &
FRONTEND_PID=$!
echo "⏳ Instalando dependências do frontend..."
wait $FRONTEND_PID
echo "✅ Dependências do frontend instaladas!"

# Criar arquivo .env a partir do .env.example se não existir
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "⏳ Criando arquivo .env a partir do .env.example..."
  cp .env.example .env
  echo "✅ Arquivo .env criado!"
fi

echo ""
echo "=== Iniciando os serviços ==="
echo "⏳ Iniciando o backend..."
cd ../backend
nohup npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend iniciado (PID: $BACKEND_PID)"

# Aguardar um pouco para o backend iniciar
sleep 3

echo "⏳ Iniciando o frontend..."
cd ../frontend
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend iniciado (PID: $FRONTEND_PID)"

echo ""
echo "=== Projeto NexIA iniciado com sucesso! ==="
echo "🔗 Frontend: http://localhost:5173"
echo "🔗 Backend API: http://localhost:3000/api"
echo ""
echo "Logs do backend: tail -f backend/backend.log"
echo "Logs do frontend: tail -f frontend/frontend.log"
echo ""
echo "Para parar os serviços, use: kill $BACKEND_PID $FRONTEND_PID"
echo ""