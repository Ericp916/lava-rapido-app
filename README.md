# Lava Rápido — Gestão Web/PWA

Aplicativo mobile-first para registrar atendimentos, controlar pagamentos, consultar histórico e gerar relatórios.

## Stack

- React + Vite
- Tailwind CSS
- Supabase Auth + Postgres + RLS
- PWA (manifest + service worker)
- Exportação Excel `.xlsx`
- GitHub + Vercel

## 1. Criar o projeto no Supabase

1. Crie uma conta/projeto em Supabase.
2. Abra **SQL Editor**.
3. Copie todo o conteúdo de `supabase/001_schema.sql` e execute.
4. Em **Project Settings > API**, copie:
   - Project URL
   - chave pública `anon` / publishable key compatível com o cliente JS.
5. Em **Authentication**, mantenha login por e-mail/senha habilitado.
6. Para produção com apenas usuários criados pelo proprietário, desabilite cadastro público de novos usuários.

> O campo visual é chamado “Usuário”, mas nesta versão ele recebe o e-mail do usuário, pois a autenticação nativa por senha do Supabase usa e-mail ou telefone.

## 2. Configurar ambiente local

```bash
cp .env.example .env
```

Preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

Nunca coloque `service_role` em variáveis `VITE_*`.

## 3. Instalar e rodar

```bash
npm install
npm run dev
```

Acesse o endereço exibido pelo Vite.

## 4. Criar usuário administrador inicial de teste

### Opção simples (recomendada)
No Dashboard do Supabase: **Authentication > Users > Add user**. Cadastre um e-mail e senha e marque o e-mail como confirmado.

### Opção por script
Use a `service_role` somente localmente:

```bash
cp .env.admin.example .env.admin
```

No macOS/Linux:

```bash
set -a; source .env.admin; set +a; npm run create:test-user
```

No PowerShell:

```powershell
$env:SUPABASE_URL="https://SEU-PROJETO.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY"
$env:ADMIN_EMAIL="admin@exemplo.com"
$env:ADMIN_PASSWORD="UmaSenhaForteAqui"
npm run create:test-user
```

Depois apague as variáveis do terminal. A `service_role` jamais deve ser publicada no GitHub ou enviada ao navegador.

## 5. Banco de dados

Tabelas:

- `clientes`: nome, telefone e data de criação.
- `veiculos`: placa única, veículo, cliente e data de criação.
- `atendimentos`: veículo, valor, forma/status de pagamento e datas.

Foi adicionado `data_pagamento` porque “recebido hoje” precisa considerar o momento real da quitação. Um atendimento antigo pago hoje entra no recebido de hoje, sem alterar seu faturamento original.

RLS está habilitado nas três tabelas. Na primeira versão, qualquer usuário autenticado pode ler/gravar os dados; usuários não autenticados não possuem essas políticas.

## 6. PWA

O projeto já contém:

- `manifest.webmanifest`
- ícones 192x192 e 512x512
- `sw.js`
- meta `theme-color`
- registro automático do service worker

Em produção HTTPS (Vercel), o navegador pode oferecer **Adicionar à tela inicial / Instalar app**. O PWA mantém o shell visual em cache, mas os dados operacionais continuam dependentes da conexão com Supabase; não há gravação offline nesta versão.

## 7. Publicar no GitHub

Crie um repositório vazio no GitHub e, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "feat: primeira versão do lava-rápido"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/lava-rapido.git
git push -u origin main
```

Confirme que `.env` e `.env.admin` não aparecem no commit.

## 8. Deploy no Vercel

> **Importante sobre custo/uso comercial:** o projeto é tecnicamente compatível com Vercel, porém o plano Hobby gratuito é destinado a uso pessoal/não comercial conforme os termos atuais da Vercel. Para operação comercial real do lava-rápido, use um plano Vercel que permita uso comercial ou escolha uma hospedagem gratuita cujos termos autorizem uso empresarial. O fluxo abaixo serve para teste/homologação no Hobby.

1. Entre no Vercel e escolha **Add New > Project**.
2. Importe o repositório GitHub.
3. Framework: Vite (normalmente detectado automaticamente).
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Faça o deploy.
8. Teste login, novo atendimento, pendentes, histórico, relatório e instalação PWA no celular.

Não configure `SUPABASE_SERVICE_ROLE_KEY` no frontend/Vercel desta aplicação.

## 9. Fluxo de uso

1. Login.
2. Dashboard mostra faturado, recebido e pendente do dia.
3. Em Novo Atendimento, digite a placa.
4. Se existir, veículo/cliente/telefone são preenchidos.
5. Se não existir, os dados são cadastrados uma única vez.
6. Pendências podem ser cobradas por WhatsApp e marcadas como pagas.
7. Histórico pesquisa por nome, placa ou telefone.
8. Relatórios diário/semanal/mensal exportam `.xlsx` com resumo e detalhes.

## 10. Checklist antes de produção

- [ ] SQL executado sem erros.
- [ ] Usuário inicial criado e senha trocada para uma senha forte.
- [ ] Cadastro público de usuários desabilitado, se não for usado.
- [ ] Variáveis Vercel configuradas.
- [ ] Teste em Android e iPhone.
- [ ] Teste com placa antiga (ABC1234) e Mercosul (ABC1D23).
- [ ] Teste de pendência paga em dia posterior ao atendimento.
- [ ] Teste do WhatsApp com DDD.
- [ ] Teste de exportação Excel.

## Estrutura

```text
lava-rapido-app/
├─ public/
│  ├─ icons/
│  ├─ manifest.webmanifest
│  └─ sw.js
├─ scripts/
│  └─ create-test-user.mjs
├─ src/
│  ├─ components/
│  ├─ context/
│  ├─ hooks/
│  ├─ lib/
│  ├─ pages/
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ styles.css
├─ supabase/
│  └─ 001_schema.sql
├─ .env.example
├─ .env.admin.example
├─ package.json
├─ vite.config.js
└─ README.md
```
