# Guia de Instalação do NexIA

Este guia fornece instruções passo a passo para configurar e executar o NexIA em um ambiente local ou em produção.

## Pré-requisitos

Antes de começar, certifique-se de ter instalado em seu sistema:

- **Node.js** versão 18 ou superior
- **npm** (geralmente vem com o Node.js)
- **MySQL** versão 8 ou superior
- **Git** para controle de versão (opcional, mas recomendado)

## Configuração do Ambiente

### 1. Clone o Repositório

```bash
git clone https://github.com/pavan-92/NexIA.git
cd NexIA
```

### 2. Instalação de Dependências

Execute o seguinte comando para instalar todas as dependências:

```bash
npm install
```

### 3. Configuração do Banco de Dados

1. Crie um banco de dados MySQL:

```sql
CREATE DATABASE nexia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Crie um usuário para o banco de dados (opcional, mas recomendado):

```sql
CREATE USER 'nexia_user'@'localhost' IDENTIFIED BY 'senha_segura';
GRANT ALL PRIVILEGES ON nexia_db.* TO 'nexia_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Configuração de Variáveis de Ambiente

1. Crie os arquivos de variáveis de ambiente a partir dos exemplos:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Edite os arquivos `.env` para incluir suas configurações:

#### Backend (.env)

```
# Backend
BACKEND_PORT=5000
PORT=5000
NODE_ENV=development

# Banco de Dados MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=nexia_user  # Ou seu usuário MySQL
DB_PASSWORD=senha_segura  # Sua senha
DB_NAME=nexia_db
AUTO_MIGRATE=true

# OpenAI
OPENAI_API_KEY=sua-chave-api-openai
```

#### Frontend (.env)

```
# Firebase (necessário para autenticação)
VITE_FIREBASE_API_KEY=sua-chave-api-firebase
VITE_FIREBASE_APP_ID=seu-app-id-firebase
VITE_FIREBASE_PROJECT_ID=seu-projeto-firebase
```

### 5. Configuração do Firebase (para Autenticação)

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Adicione uma aplicação web ao seu projeto
4. Copie as credenciais fornecidas para o seu arquivo `.env` do frontend
5. Ative o método de autenticação do Google (Authentication > Sign-in method)
6. Adicione seu domínio (ou localhost) à lista de domínios autorizados

### 6. Configuração da API da OpenAI

1. Acesse [OpenAI API Keys](https://platform.openai.com/account/api-keys)
2. Crie uma nova chave de API
3. Copie a chave para a variável `OPENAI_API_KEY` no arquivo `.env` do backend

## Execução do Projeto

### Ambiente de Desenvolvimento

Para iniciar o ambiente de desenvolvimento:

```bash
npm run dev
```

Isso iniciará tanto o servidor backend quanto o frontend em modo de desenvolvimento.

- Backend: http://localhost:5000
- Frontend: http://localhost:5173 (o frontend também está acessível através do backend)

### Construção para Produção

Para construir o projeto para produção:

```bash
npm run build
```

Para iniciar o servidor em modo de produção:

```bash
npm start
```

## Estrutura de Diretórios

```
NexIA/
├── backend/           # Código do servidor
│   ├── config/        # Configurações (banco de dados, autenticação)
│   ├── controllers/   # Controladores da API
│   ├── models/        # Modelos de dados
│   ├── routes/        # Rotas da API
│   └── services/      # Serviços (OpenAI, etc.)
├── frontend/          # Código do cliente
│   └── src/           # Código-fonte React
├── public/            # Arquivos estáticos
└── server/            # Ponto de entrada para o Replit
```

## Solução de Problemas

### Problemas de Conexão com o Banco de Dados

- Verifique se o MySQL está em execução
- Confirme que as credenciais no arquivo `.env` estão corretas
- Verifique se o banco de dados `nexia_db` existe

### Problemas com API da OpenAI

- Verifique se a chave da API é válida
- Confirme que você tem créditos suficientes na sua conta OpenAI
- Verifique os logs do servidor para mensagens de erro detalhadas

### Problemas de Autenticação Firebase

- Verifique se as credenciais do Firebase estão configuradas corretamente
- Confirme que o método de autenticação do Google está ativado no console do Firebase
- Verifique se o domínio está na lista de domínios autorizados

## Suporte

Se encontrar problemas na instalação, abra uma issue no GitHub ou entre em contato com a equipe de desenvolvimento.