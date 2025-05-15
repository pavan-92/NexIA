# Frontend da NexIA

## Descrição
Frontend da plataforma NexIA para automação de documentação médica através de inteligência artificial. Esta interface permite que médicos gravem consultas, visualizem transcrições e gerenciem prontuários médicos gerados por IA.

## Tecnologias Utilizadas
- React 18+
- TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication
- React Query

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
- `VITE_API_URL`: URL da API backend (ex: http://localhost:3000/api)
- `VITE_FIREBASE_API_KEY`: Chave de API do Firebase
- `VITE_FIREBASE_AUTH_DOMAIN`: Domínio de autenticação do Firebase
- `VITE_FIREBASE_PROJECT_ID`: ID do projeto Firebase
- `VITE_FIREBASE_STORAGE_BUCKET`: Bucket de armazenamento do Firebase
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: ID do remetente de mensagens do Firebase
- `VITE_FIREBASE_APP_ID`: ID do aplicativo Firebase

## Rodar localmente
```bash
npm run dev
```

O aplicativo será iniciado na porta 5173 por padrão e pode ser acessado em [http://localhost:5173](http://localhost:5173).

## Estrutura do Projeto
- `src/components`: Componentes reutilizáveis da UI
- `src/pages`: Páginas da aplicação
- `src/hooks`: Custom hooks
- `src/context`: Providers de contexto (autenticação, etc.)
- `src/lib`: Funções utilitárias e configurações
- `src/assets`: Imagens, ícones e outros recursos estáticos

## Funcionalidades Principais
- Autenticação de usuários (médicos)
- Cadastro e gestão de pacientes
- Gravação de áudio de consultas
- Transcrição automática de áudio
- Geração de prontuários no formato SOAP com códigos CID-10
- Visualização e gerenciamento de histórico de consultas

## Build para Produção
```bash
npm run build
```

Os arquivos serão gerados na pasta `dist`.

## Deploy

### Deploy com Vercel
```bash
npm install -g vercel
vercel
```

### Deploy com Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

## Testes
```bash
npm run test
```