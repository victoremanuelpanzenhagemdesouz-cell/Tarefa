# TaskFlow

TaskFlow é um protótipo frontend de gerenciamento de tarefas, feito com HTML5 semântico, CSS puro e JavaScript moderno. Os dados de demonstração são mantidos somente na memória da página: nenhuma informação é enviada ou salva em um servidor.

## Executar localmente

Abra `index.html` diretamente em um navegador moderno. Não há dependências nem etapa de instalação.

## Funcionalidades

- Criar tarefas com título, categoria e prioridade.
- Concluir, reabrir e excluir tarefas.
- Pesquisar por título e filtrar por status ou prioridade alta.
- Acompanhar total, concluídas, pendentes e percentual de conclusão.
- Interface responsiva com notificações e estado vazio.

## Estado atual

Frontend funcional em modo de demonstração. A lista inicial contém três tarefas de exemplo. Ao recarregar a página, as alterações são descartadas. Supabase, autenticação e publicação no GitHub Pages ainda não foram integrados.

## Proteções incluídas nesta etapa

- Conteúdo de tarefas e notificações é inserido como texto com `textContent` e elementos DOM; entradas não são interpoladas em `innerHTML`.
- Título, categoria e prioridade são validados no JavaScript antes de criar tarefas ou renderizar dados.
- A página define uma Content Security Policy restritiva para os recursos locais atuais e uma política de referência.
- O projeto não contém credenciais ou chaves de serviços externos.

Essas medidas protegem aspectos do frontend, mas não substituem autenticação, políticas RLS e permissões no Supabase. Ao integrar o Supabase, a CSP deverá ser atualizada para permitir somente o endpoint e os recursos realmente usados. Cabeçalhos HTTP que não podem ser definidos por uma meta tag precisam ser configurados na hospedagem ou no servidor.
