# Instruções para o Frontend NexIA

Este documento contém instruções detalhadas para executar e trabalhar com o frontend da aplicação NexIA.

## Executando o Frontend no Replit

O projeto no Replit já está configurado com um servidor backend rodando na porta 5000. Para iniciar o frontend, você precisará abrir um novo terminal e executar os seguintes comandos:

```bash
cd frontend
npm install      # Instalar dependências (apenas na primeira vez)
npm run dev      # Iniciar o servidor de desenvolvimento
```

O servidor Vite iniciará e estará disponível na porta 5173.

## Navegando no Aplicativo

O frontend possui as seguintes páginas principais:

- **Página Inicial:** Rota `/` - Apresenta a página de boas vindas da NexIA
- **Página de Teste:** Rota `/test` - Demonstra que o frontend está funcionando corretamente

Você pode navegar entre as páginas utilizando os links no cabeçalho ou os botões disponíveis na interface.

## Verificando a Conexão com o Backend

O frontend está configurado para se conectar ao backend através do proxy configurado no arquivo `vite.config.ts`. 

Para verificar se a conexão está funcionando corretamente, você pode:

1. Acessar o endpoint de verificação de saúde: `/api/health`
2. Verificar no console do navegador se há erros de conexão

## Estrutura de Arquivos

O frontend segue uma estrutura organizada baseada em:

- **Components:** Componentes reutilizáveis como Header e Layout
- **Pages:** Páginas da aplicação como Home e Test
- **Assets:** Arquivos estáticos como imagens e ícones

## Desenvolvimento

Para desenvolver novas funcionalidades:

1. Crie novos componentes em `src/components/`
2. Adicione novas páginas em `src/pages/`
3. Atualize as rotas em `src/App.tsx`

## Problemas Comuns

Se encontrar problemas ao executar o frontend:

- Verifique se todas as dependências foram instaladas com `npm install`
- Certifique-se de que o servidor backend está em execução na porta 5000
- Verifique se não há erros de compilação no console do terminal ou navegador

## Próximos Passos no Desenvolvimento

Depois de confirmar que o frontend básico está funcionando:

1. Implementar autenticação com Firebase
2. Adicionar formulários de pacientes
3. Criar componentes para transcrição e geração de prontuários
4. Implementar integração completa com o backend