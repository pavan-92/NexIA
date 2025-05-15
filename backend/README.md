# Backend da NexIA

## Descrição
Backend da plataforma NexIA para automação de documentação médica através de inteligência artificial. Esse sistema processa gravações de consultas médicas, realiza transcrições e gera documentação formatada para prontuários médicos.

## Instalação
```bash
npm install
```

## Configuração do ambiente
Copie o arquivo `.env-example` para `.env` e ajuste as variáveis conforme necessário:

```bash
cp .env-example .env
```

Configure as variáveis de ambiente no arquivo `.env`:
- `DB_HOST`: Host do banco de dados MySQL
- `DB_PORT`: Porta do banco de dados (padrão: 3306)
- `DB_USER`: Usuário do banco de dados
- `DB_PASSWORD`: Senha do banco de dados
- `DB_NAME`: Nome do banco de dados
- `OPENAI_API_KEY`: Chave de API da OpenAI para transcrição e geração de documentos
- Configurações do Firebase (para autenticação)

## Banco de Dados
O sistema utiliza MySQL como banco de dados. Certifique-se de criar o banco de dados antes de iniciar a aplicação:

```bash
mysql -u root -p
CREATE DATABASE nexia_db;
```

## Rodar localmente
```bash
npm run dev
```

O servidor será iniciado na porta 3000 por padrão (ou na porta configurada na variável `PORT` do arquivo `.env`).

## API Endpoints

### Autenticação
- POST `/api/auth/verify`: Verifica se o token de autenticação é válido

### Pacientes
- GET `/api/patients`: Lista todos os pacientes
- GET `/api/patients/:id`: Busca paciente por ID
- POST `/api/patients`: Cadastra novo paciente
- PUT `/api/patients/:id`: Atualiza dados de paciente
- DELETE `/api/patients/:id`: Remove paciente

### Consultas
- GET `/api/consultations`: Lista todas as consultas
- GET `/api/consultations/:id`: Busca consulta por ID
- GET `/api/consultations/patient/:patientId`: Busca consultas por paciente
- POST `/api/consultations`: Cadastra nova consulta
- PUT `/api/consultations/:id`: Atualiza dados de consulta
- DELETE `/api/consultations/:id`: Remove consulta

### Transcrição e Documentação
- POST `/api/transcription/transcribe`: Transcreve arquivo de áudio
- POST `/api/transcription/generate-notes`: Gera prontuário a partir de transcrição
- POST `/api/transcription/translate`: Traduz texto entre idiomas

## Deploy
Utilize PM2, Docker ou outro serviço de sua escolha para o deploy. Certifique-se de configurar corretamente as variáveis de ambiente no ambiente de produção.

### Deploy com PM2
```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name nexia-backend
```

### Deploy com Docker
```bash
docker build -t nexia-backend .
docker run -p 3000:3000 --env-file .env nexia-backend
```