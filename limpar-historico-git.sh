#!/bin/bash

# Script para limpar o histórico do Git e remover chaves de API expostas
# Execute este script em sua máquina local após baixar o código do Replit

# Cores para mensagens
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Limpando histórico do Git para o projeto NexIA ===${NC}"
echo -e "${RED}AVISO: Este script irá recriar todo o histórico do Git.${NC}"
echo -e "${RED}Certifique-se de ter feito backup de qualquer conteúdo importante.${NC}"
echo ""

read -p "Deseja continuar? (s/n): " CONTINUAR
if [[ $CONTINUAR != "s" && $CONTINUAR != "S" ]]; then
  echo "Operação cancelada."
  exit 0
fi

# Verificar se git está instalado
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git não está instalado. Por favor, instale-o primeiro.${NC}"
    exit 1
fi

# 1. Inicializar um novo repositório Git
echo -e "${GREEN}1. Criando um novo repositório Git limpo...${NC}"
rm -rf .git
git init

# 2. Adicionar .gitignore para garantir que arquivos sensíveis não sejam commitados
echo -e "${GREEN}2. Verificando .gitignore...${NC}"
if [ ! -f .gitignore ]; then
  echo -e "${BLUE}Criando arquivo .gitignore${NC}"
  cat > .gitignore << EOF
# Dependências
node_modules/
.pnp
.pnp.js

# Arquivos de build
/dist
/build
/frontend/dist
/backend/dist

# Variáveis de ambiente e segredos
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
/backend/.env
/frontend/.env
*.env

# Arquivos de log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs
*.log

# Diretório de uploads temporários
uploads/
tmp/

# Arquivos gerados pelo sistema operacional
.DS_Store
Thumbs.db

# Arquivos específicos do Replit
.replit
replit.nix
.cache/
.config/
.local/
.upm/
.breakpoints

# Outros
.idea/
.vscode/
coverage/
*.pid
*.seed
*.pid.lock
.vercel
.next
.output
EOF
fi

# 3. Verificar arquivos env
echo -e "${GREEN}3. Verificando arquivos .env...${NC}"

# Verificar se existem arquivos .env sem example
for ENV_FILE in $(find . -name ".env" -not -path "*/node_modules/*"); do
  EXAMPLE_FILE="${ENV_FILE%.env}.env.example"
  
  # Se não existe arquivo example correspondente, criar um
  if [ ! -f "$EXAMPLE_FILE" ]; then
    echo -e "${BLUE}Criando $EXAMPLE_FILE baseado em $ENV_FILE${NC}"
    cat "$ENV_FILE" | sed 's/=.*/=seu_valor_aqui/g' > "$EXAMPLE_FILE"
  fi
  
  # Remover quaisquer chaves reais nos arquivos .env
  echo -e "${BLUE}Limpando $ENV_FILE${NC}"
  if grep -q "OPENAI_API_KEY" "$ENV_FILE"; then
    sed -i 's/\(OPENAI_API_KEY=\).*/\1YOUR_OPENAI_API_KEY_HERE/g' "$ENV_FILE"
  fi
  
  if grep -q "FIREBASE_API_KEY" "$ENV_FILE"; then
    sed -i 's/\(.*FIREBASE_API_KEY=\).*/\1YOUR_FIREBASE_API_KEY_HERE/g' "$ENV_FILE"
  fi
done

# 4. Adicionar todos os arquivos
echo -e "${GREEN}4. Adicionando arquivos ao stage...${NC}"
git add .

# 5. Criar o primeiro commit
echo -e "${GREEN}5. Criando commit inicial...${NC}"
git commit -m "Versão inicial do NexIA - Histórico limpo sem chaves de API"

# 6. Configurar o repositório remoto
echo -e "${GREEN}6. Configurando repositório remoto...${NC}"
git remote add origin https://github.com/pavan-92/NexIA.git

# 7. Enviar ao GitHub com força
echo -e "${GREEN}7. Enviando ao GitHub (você precisará fornecer credenciais)...${NC}"
echo -e "${BLUE}Usando push com força para substituir o histórico antigo${NC}"
git push -u origin master --force || git push -u origin main --force

echo ""
echo -e "${BLUE}=== Processo concluído! ===${NC}"
echo -e "${BLUE}O histórico do Git foi recriado sem as chaves de API expostas.${NC}"
echo -e "${BLUE}Verifique se todos os arquivos foram enviados corretamente em:${NC}"
echo -e "${BLUE}https://github.com/pavan-92/NexIA${NC}"