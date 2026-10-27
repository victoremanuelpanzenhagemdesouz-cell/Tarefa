# TaskFlow

TaskFlow é uma aplicação de gerenciamento de tarefas feita com HTML5 semântico, CSS puro e JavaScript moderno. O login e as tarefas usam Supabase Auth e a tabela `public.tasks`.

## Executar localmente

Sirva os arquivos por HTTP local, por exemplo com a extensão Live Server do VS Code, e abra o endereço local configurado em **Authentication → URL Configuration → Redirect URLs** no Supabase. O login não deve ser testado abrindo `index.html` como `file://`.

## Funcionalidades

- Criar tarefas com título, categoria e prioridade.
- Concluir, reabrir e excluir tarefas.
- Pesquisar por título e filtrar por status ou prioridade alta.
- Acompanhar total, concluídas, pendentes e percentual de conclusão.
- Interface responsiva com notificações e estado vazio.
- Criar conta por email, confirmar o cadastro, entrar e sair.
- Carregar e salvar tarefas na conta autenticada.

## Estado atual

Frontend conectado ao projeto Supabase configurado em `supabase-config.js`. A biblioteca oficial `supabase-js` é carregada por CDN. O projeto deve ter a tabela `tasks`, acesso à Data API, RLS ativado e políticas compatíveis com `user_id = auth.uid()` para as quatro operações. A autenticação por email pode exigir confirmação antes do primeiro login.

## Proteções incluídas nesta etapa

- Conteúdo de tarefas e notificações é inserido como texto com `textContent` e elementos DOM; entradas não são interpoladas em `innerHTML`.
- Título, categoria e prioridade são validados no JavaScript antes de criar tarefas ou renderizar dados.
- A página define uma Content Security Policy restritiva para os recursos locais atuais e uma política de referência.
- O arquivo de configuração contém somente a Project URL e a publishable key, que são valores públicos; não coloque uma secret key ou `service_role` no frontend.

Essas medidas protegem aspectos do frontend, mas não substituem políticas RLS e permissões corretas no Supabase. A sessão do cliente de navegador é gerenciada pela biblioteca Supabase. A CSP atual permite a biblioteca pelo CDN jsDelivr e conexões somente ao endpoint Supabase configurado. Cabeçalhos HTTP que não podem ser definidos por uma meta tag precisam ser configurados na hospedagem ou no servidor.
