# NexIA - Prontuário Médico Inteligente

NexIA é uma plataforma médica inovadora que utiliza Inteligência Artificial para automatizar a documentação de consultas médicas, transformando conversas em prontuários formatados.

## Sobre o Projeto

NexIA (anteriormente Prontu.live) é uma solução avançada para médicos e profissionais de saúde que automatiza o processo de documentação de consultas. A plataforma:

- Transcreve automaticamente a consulta médico-paciente usando OpenAI Whisper
- Converte a transcrição em prontuários médicos formatados seguindo o padrão SOAP
- Identifica e inclui códigos CID-10 relevantes
- Fornece interface intuitiva para gerenciamento de pacientes e consultas
- Permite exportação de prontuários em formato PDF
- Suporta funcionalidade multilíngue para atenção global

## Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend:** Node.js, Express, TypeScript
- **Banco de Dados:** MySQL com Drizzle ORM
- **Autenticação:** Firebase Auth
- **IA/ML:** OpenAI GPT-4o, OpenAI Whisper
- **Comunicação em Tempo Real:** WebSockets

## Configuração do Ambiente

### Pré-requisitos

- Node.js 18+ e npm
- MySQL 8
- Conta na OpenAI para API
- Projeto Firebase (opcional, para autenticação)

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/pavan-92/NexIA.git
   cd NexIA
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Estrutura do Projeto

```
NexIA/
├── backend/           # Código do servidor Node.js/Express
│   ├── config/        # Configurações (banco de dados, Firebase, etc.)
│   ├── controllers/   # Controladores da API
│   ├── models/        # Definição do esquema de dados
│   ├── routes/        # Rotas da API
│   └── services/      # Serviços (OpenAI, etc.)
├── frontend/          # Aplicação React/TypeScript
│   └── src/           # Código fonte do frontend
├── public/            # Arquivos estáticos
└── server/            # Ponto de entrada para o Replit
```

## Segurança e Privacidade

NexIA foi projetado priorizando a segurança e privacidade dos dados:

- Todas as APIs externas são acessadas usando chaves armazenadas em variáveis de ambiente
- Dados sensíveis são protegidos em banco de dados com controle de acesso rigoroso
- Autenticação via Firebase com opções para múltiplos fatores
- Conformidade com regulamentações de dados de saúde

## Recursos Principais

1. **Transcrição de Consultas**
   - Gravação e transcrição automática de áudio
   - Interface intuitiva para edição e correção

2. **Geração de Prontuários SOAP**
   - Estruturação automática em Subjetivo, Objetivo, Avaliação e Plano
   - Identificação de códigos CID-10 relevantes

3. **Gestão de Pacientes**
   - Cadastro completo com informações médicas relevantes
   - Histórico de consultas e prontuários

## Licença

Este projeto está sob a licença [MIT](LICENSE).