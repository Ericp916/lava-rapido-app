# Atualização 06 — Descrição do Serviço

Esta atualização adiciona um campo obrigatório **Descrição do Serviço** em **Novo Atendimento**.

## O que muda
- Novo campo de texto livre para registrar o serviço realizado no veículo.
- Exemplos: lavagem completa, lavagem simples, remoção de ralado, higienização, polimento etc.
- A descrição aparece no Histórico e em Pendentes.
- O campo também é exportado para a aba Atendimentos dos relatórios Excel.
- Atendimentos antigos permanecem válidos e ficam com descrição vazia.

## Instalação
1. Execute `supabase/004_descricao_servico.sql` no SQL Editor do Supabase.
2. Copie os arquivos desta atualização sobre o projeto local.
3. Rode `npm run dev` e teste um novo atendimento.
4. Depois faça commit/push para o GitHub; a Vercel atualizará pelo fluxo já configurado.
