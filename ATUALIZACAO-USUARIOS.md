# Atualização 04 — Login e gestão de usuários

Esta atualização adiciona login por **usuário + senha**, sem solicitar e-mail na interface, e cria a área **Usuários** exclusiva do administrador.

## O que muda

- Seu login passa a ser `eric`.
- A senha continua sendo a mesma senha atual do Supabase.
- O e-mail atual do administrador continua existindo apenas internamente no Supabase Auth; ele não aparece na tela de login.
- Novos funcionários recebem apenas **nome, login e senha**.
- Apenas o administrador vê a área **Usuários**.
- Usuários comuns podem usar atendimentos, pendentes, histórico e relatórios.
- Usuários podem ser ativados/inativados e ter a senha redefinida pelo administrador.
- Usuários inativos perdem acesso aos dados via RLS.

## Ordem de instalação — importante

Faça nesta ordem para evitar interromper o sistema:

1. Executar `supabase/002_usuarios.sql` no SQL Editor.
2. Criar/deployar a Edge Function `auth-login`.
3. Criar/deployar a Edge Function `manage-users`.
4. Atualizar o código React local com este pacote.
5. Testar localmente.
6. Commit + push para GitHub.
7. Aguardar o novo deploy automático da Vercel.

## 1. SQL

No Supabase: **SQL Editor > New query**. Abra o arquivo `supabase/002_usuarios.sql`, copie tudo, cole e clique em **Run**.

O script espera encontrar exatamente **1 usuário** em Authentication e transforma esse usuário em administrador com:

- Nome: Eric Polari
- Login: `eric`
- Perfil: admin
- Status: ativo

Se houver mais de um usuário antes desta atualização, o script para com uma mensagem de erro em vez de escolher alguém sozinho.

## 2. Edge Function `auth-login`

No Supabase: **Edge Functions > Deploy a new function > Via Editor**.

Nome da função: `auth-login`

Substitua o conteúdo pelo arquivo:

`supabase/functions/auth-login/index.ts`

Faça o deploy. A função deve ficar com a verificação JWT da plataforma **desativada**, pois ela é o endpoint público de login e faz a validação internamente.

## 3. Edge Function `manage-users`

Crie outra função pelo Dashboard.

Nome: `manage-users`

Código:

`supabase/functions/manage-users/index.ts`

Faça o deploy e também deixe a verificação JWT da plataforma **desativada**. Esta função valida o JWT do usuário dentro do próprio código e ainda exige que o perfil seja `admin`.

Nenhuma `service_role` ou secret key deve ser colocada no React ou na Vercel. As Edge Functions hospedadas usam as variáveis internas do próprio projeto Supabase.

## 4. Teste esperado

Depois que o React for atualizado, a tela de login passa a pedir:

- Login: `eric`
- Senha: a senha atual que você já usa

Após entrar, o Dashboard do administrador mostrará o botão **Usuários**.

Crie um teste, por exemplo:

- Nome: Usuário Teste
- Login: teste
- Senha: Teste@1234

Depois abra uma janela anônima e tente entrar com `teste` + a senha criada.

## 5. Segurança

- Não existe senha salva na tabela `perfis`.
- As senhas continuam sendo controladas pelo Supabase Auth.
- O e-mail técnico dos novos usuários é criado somente nos bastidores e nunca é solicitado na interface.
- A chave `service_role` permanece somente no ambiente seguro das Edge Functions.
- Usuários comuns não conseguem chamar ações administrativas, mesmo tentando acessar a função diretamente.
