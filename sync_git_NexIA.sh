#!/bin/bash

# Script para sincronizar alterações do Replit com o GitHub
# Este script assume que o repositório já foi configurado com git remote

# Cores para mensagens
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Sincronizando NexIA com o GitHub ===${NC}"

# Verificar se git está instalado
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git não está instalado. Por favor, instale-o primeiro.${NC}"
    exit 1
fi

# Verificar se temos um remote configurado
if ! git remote | grep -q "origin"; then
    echo -e "${BLUE}Configurando remote 'origin'...${NC}"
    git remote add origin https://github.com/pavan-92/NexIA.git
fi

# Verificar status do git
echo -e "${GREEN}Verificando mudanças locais...${NC}"
git status

# Perguntar se quer continuar
read -p "Deseja continuar com a sincronização? (s/n): " CONTINUAR
if [[ $CONTINUAR != "s" && $CONTINUAR != "S" ]]; then
  echo "Operação cancelada."
  exit 0
fi

# Verificar arquivos que podem conter API keys antes de commit
echo -e "${GREEN}Verificando arquivos por API keys expostas...${NC}"
API_KEY_FILES=$(grep -r "sk-" --include="*.js" --include="*.ts" --include="*.env" . | grep -v "node_modules" || true)

if [ ! -z "$API_KEY_FILES" ]; then
    echo -e "${RED}AVISO: Encontradas possíveis chaves de API expostas:${NC}"
    echo "$API_KEY_FILES"
    read -p "Deseja continuar mesmo assim? (s/n): " CONTINUAR_KEYS
    if [[ $CONTINUAR_KEYS != "s" && $CONTINUAR_KEYS != "S" ]]; then
      echo "Operação cancelada. Remova ou oculte as chaves de API antes de continuar."
      exit 0
    fi
fi

# Adicionar todas as alterações
echo -e "${GREEN}Adicionando alterações...${NC}"
git add .

# Pedir mensagem de commit
echo -e "${GREEN}Digite a mensagem para o commit:${NC}"
read COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Atualização automática do NexIA"
fi

# Criar commit
echo -e "${GREEN}Criando commit...${NC}"
git commit -m "$COMMIT_MSG"

# Obter a branch atual
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ -z "$BRANCH" ] || [ "$BRANCH" == "HEAD" ]; then
    BRANCH="main"
fi

# Enviar ao GitHub
echo -e "${GREEN}Enviando para o GitHub na branch $BRANCH...${NC}"
git push -u origin $BRANCH

# Verificar se o push foi bem-sucedido
if [ $? -eq 0 ]; then
    echo -e "${BLUE}=== Sincronização concluída com sucesso! ===${NC}"
    echo -e "${BLUE}Verifique as alterações em: https://github.com/pavan-92/NexIA${NC}"
else
    echo -e "${RED}Erro ao enviar para o GitHub. Verifique suas credenciais e conexão.${NC}"
fi