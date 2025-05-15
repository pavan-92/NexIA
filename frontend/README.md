# Frontend NexIA

Este diretório contém o código do frontend para a aplicação NexIA, um sistema avançado de documentação médica baseado em IA.

## Estrutura do Projeto

```
frontend/
├── public/                # Arquivos estáticos
│   ├── favicon.svg       # Ícone da aplicação
│   └── logo.png          # Logo da NexIA
├── src/                   # Código fonte
│   ├── assets/           # Arquivos de mídia (imagens, etc.)
│   ├── components/       # Componentes React reutilizáveis
│   ├── context/          # Contextos React
│   ├── hooks/            # Hooks personalizados
│   ├── lib/              # Utilitários e configurações
│   ├── pages/            # Páginas da aplicação
│   ├── services/         # Serviços para integração com APIs
│   ├── styles/           # Estilos globais
│   ├── types/            # Definições de tipos TypeScript
│   ├── utils/            # Funções utilitárias
│   ├── App.tsx           # Componente principal da aplicação
│   ├── index.css         # Estilos CSS globais (Tailwind)
│   └── main.tsx          # Ponto de entrada da aplicação
├── .env                   # Variáveis de ambiente (local)
├── .env.example           # Exemplo de variáveis de ambiente
├── index.html             # HTML base
├── package.json           # Dependências e scripts
├── postcss.config.js      # Configuração do PostCSS
├── tailwind.config.js     # Configuração do Tailwind CSS
├── tsconfig.json          # Configuração do TypeScript
└── vite.config.ts         # Configuração do Vite
```

## Tecnologias Utilizadas

- React 18
- TypeScript
- Tailwind CSS para estilização
- Vite como bundler e servidor de desenvolvimento
- Wouter para roteamento
- React Query para gerenciamento de estado remoto
- React Hook Form para formulários

## Instalação e Execução

Para executar o frontend NexIA:

1. Instale as dependências:
   ```bash
   cd frontend
   npm install
   ```

2. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

O aplicativo estará disponível em `http://localhost:5173`

## Conexão com o Backend

O frontend está configurado para se comunicar com o backend por meio de requisições à API. A comunicação é gerenciada através de:

- Axios para requisições HTTP
- React Query para gerenciamento de cache e estado das requisições

## Convenções de Código

- Componentes são nomeados em PascalCase
- Hooks personalizados começam com `use`
- Páginas são definidas dentro do diretório `pages`
- Estilos são gerenciados principalmente via Tailwind CSS
- Tipos são definidos em arquivos separados na pasta `types`

## Navegação

A aplicação usa o Wouter para roteamento, permitindo uma navegação eficiente entre páginas. As principais rotas incluem:

- `/` - Página inicial
- `/login` - Página de login
- `/register` - Página de registro
- `/dashboard` - Dashboard principal
- `/patients` - Lista de pacientes
- `/patients/:id` - Detalhes de um paciente específico
- `/consultation/:patientId` - Nova consulta para um paciente

## Desenvolvimento

Para desenvolver novas funcionalidades:

1. Crie novos componentes na pasta `components`
2. Adicione novas páginas na pasta `pages`
3. Defina tipos relacionados na pasta `types`
4. Conecte-se a novos endpoints da API através de serviços em `services`
5. Atualize o arquivo `App.tsx` para adicionar novas rotas