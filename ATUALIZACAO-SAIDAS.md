# Atualização 05 — Saídas / Gastos do caixa

Esta atualização adiciona o módulo **Saídas** ao Lava Rápido.

## Regra financeira

- O caixa é geral: PIX + Dinheiro + Cartão entram no mesmo total recebido.
- `Saldo = Recebido - Saídas`.
- Uma saída não reduz o faturamento e não altera o atendimento que gerou a receita.
- Usuários comuns e administrador podem registrar saídas.
- O responsável é gravado automaticamente pelo banco a partir do usuário logado.

## O que foi incluído

- Nova tabela `public.saidas`.
- Nova tela **Saídas**.
- Campos: justificativa, valor e data da saída.
- Histórico dos últimos 100 lançamentos com responsável.
- Dashboard: **Saídas hoje** e **Saldo hoje**.
- Tela Saídas: **Saldo geral do caixa**.
- Relatórios diário/semanal/mensal: **Saídas** e **Saldo**.
- Exportação Excel com uma nova planilha chamada **Saídas**.

## Ordem de instalação

1. No Supabase, execute `supabase/003_saidas.sql` no **SQL Editor**.
2. No Mac, aplique os arquivos desta atualização sobre a pasta `lava-rapido-app`.
3. Rode `npm run build` para validar.
4. Rode `npm run dev` e teste localmente.
5. Se estiver correto, faça commit/push para o GitHub. A Vercel fará o novo deploy.

Nenhuma nova Edge Function é necessária para este módulo.
