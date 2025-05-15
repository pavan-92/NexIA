#!/bin/bash

# Script para publicar o NexIA no GitHub
# Execute este script em sua máquina local após baixar o código do Replit

# Cores para mensagens
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Publicando NexIA no GitHub ===${NC}"
echo -e "${BLUE}Repositório: https://github.com/pavan-92/NexIA${NC}"
echo ""

# Verificar se git está instalado
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git não está instalado. Por favor, instale-o primeiro.${NC}"
    exit 1
fi

# Verificar se o repositório já existe
if [ -d ".git" ]; then
    echo -e "${BLUE}Repositório Git já existe, usando-o...${NC}"
else
    # Inicializar repositório Git
    echo -e "${GREEN}1. Inicializando repositório Git...${NC}"
    git init
fi

# Configurar o repositório remoto
echo -e "${GREEN}2. Configurando repositório remoto...${NC}"
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/pavan-92/NexIA.git

# Criar arquivo .gitignore
echo -e "${GREEN}3. Criando arquivo .gitignore...${NC}"
cat > .gitignore << EOF
node_modules/
.env
.DS_Store
*.log
*.pid
*.seed
*.pid.lock
.env.local
.env.development.local
.env.test.local
.env.production.local
.cache/
.upm/
.config/
.local/
EOF

# Adicionar todos os arquivos
echo -e "${GREEN}4. Adicionando arquivos ao stage...${NC}"
git add .

# Criar o primeiro commit
echo -e "${GREEN}5. Criando commit inicial...${NC}"
git commit -m "Versão inicial do NexIA"

# Enviar ao GitHub
echo -e "${GREEN}6. Enviando ao GitHub (você precisará fornecer credenciais)...${NC}"
echo -e "${BLUE}Tentando fazer push com força...${NC}"
git push -u origin master --force || git push -u origin main --force

echo ""
echo -e "${BLUE}=== Processo concluído! ===${NC}"
echo -e "${BLUE}Verifique se todos os arquivos foram enviados corretamente em:${NC}"
echo -e "${BLUE}https://github.com/pavan-92/NexIA${NC}"