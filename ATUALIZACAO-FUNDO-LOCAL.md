ATUALIZAÇÃO 17 — FUNDO LOCAL NO PROJETO

O que foi feito:
- A imagem de fundo do login foi incorporada diretamente no projeto em public/login-background.jpg.
- O CSS agora usa url("/login-background.jpg") em vez de um link do SharePoint.

Benefícios:
- Funciona no desktop e no mobile.
- Evita bloqueios do SharePoint no celular.
- Mantém a imagem servida pela própria Vercel junto com o app.

Não precisa executar SQL.
