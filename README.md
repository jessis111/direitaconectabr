# Direita Conecta br · Plataforma

A rede de negócios de quem acredita no Brasil que trabalha. A landing e o formulário de cadastro continuam na página atual (Cloudflare Pages); este repositório é só o sistema, que começa no login. Membros aprovados publicam oportunidades (modelo Workana), mostram seus serviços (modelo iFood), conversam no chat interno e fecham negócio por telefone ou WhatsApp. A plataforma conecta e não intermedeia dinheiro.

Stack: Next.js 15 (App Router) + TypeScript + Tailwind 4, Supabase (Postgres, Auth por link mágico, Storage e Realtime), Resend para e-mails, hospedagem na Vercel.

## O que já está pronto (MVP do PRD)

| Módulo | Telas e regras |
| --- | --- |
| Cadastro e acesso | O formulário da landing grava o membro pendente pela rota `/api/cadastro`; login por link mágico ou código de 6 dígitos, tela "aguardando aprovação" para pendentes e bloqueados, importação da planilha |
| Perfil | Foto, título, bio (500), categorias (até 5), Instagram, site, WhatsApp e telefone. Perfil sem título e categorias não aparece na busca |
| Onboarding | 3 passos no primeiro acesso (foto e título, categorias, serviços), com opção de pular |
| Oportunidades | Publicar (geral ou campanha UGC), lista com filtros (palavra, categoria, UF, data, remoto, minhas), detalhe, propostas (até 15 por oportunidade, uma por membro), fechar indicando com quem fechou, reabrir, excluir, fechamento automático em 60 dias |
| Serviços | Até 5 por membro, vitrine com filtros (categoria, UF, cidade, palavra), "Pedir proposta" que já abre a conversa |
| UGC creators | Aba que é um recorte dos serviços na categoria "UGC creator": nichos (até 3), formatos, remoto ou presencial, TikTok, portfólio de até 6 vídeos/fotos (upload ou link), filtros por nicho, formato, UF, preço |
| Propostas e contato | Propostas recebidas e enviadas, chat 1 a 1 em tempo real com texto e imagem, botões fixos "Ligar" e "Chamar no WhatsApp" (só aparecem com conversa aberta), e-mail ao receber proposta ou pedido e para mensagem sem leitura há mais de 1 hora |
| Admin | Painel com as métricas do PRD, fila de aprovação com aprovação em lote, membros com busca, bloqueio, remoção e exportação CSV, denúncias, categorias editáveis sem código |

Privacidade: e-mail, WhatsApp e telefone nunca saem pela API direta (privilégio por coluna no Postgres). O contato só é entregue pela função `contato_membro`, que exige conversa aberta entre os dois. Pendentes e bloqueados não leem nada de outros membros (RLS).

## Estrutura

```
supabase/
  migrations/0001_schema.sql   tabelas, RLS, gatilhos e funções
  migrations/0002_storage.sql  buckets avatars, portfolio e chat
  seed.sql                     categorias iniciais
  templates/                   e-mails de link mágico e convite
src/app/
  page.tsx                     redireciona para login ou início
  (auth)/entrar                login
  aguardando, onboarding
  (app)/inicio, oportunidades, servicos, creators, membros/[id],
        perfil, perfil/servicos, propostas, conversas, admin
  api/cadastro                 recebe o formulário da landing atual
  api/cron                     agendamento de hora em hora
  api/admin/exportar           CSV de membros
scripts/import-planilha.mjs    importa a planilha de cadastros
```

## Colocar no ar

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (plano Free, região São Paulo).
2. Rode as migrações e as categorias. Pelo terminal, com a [CLI](https://supabase.com/docs/guides/cli):
   ```bash
   npx supabase login
   npx supabase link --project-ref SEU_PROJECT_REF
   npx supabase db push
   psql "$(npx supabase db url)" -f supabase/seed.sql   # ou cole o seed.sql no SQL Editor
   ```
   Sem terminal: cole `0001_schema.sql`, `0002_storage.sql` e `seed.sql`, nessa ordem, no SQL Editor do painel.
3. Authentication > URL Configuration:
   - Site URL: `https://app.direitaconecta.com.br`
   - Redirect URLs: `https://app.direitaconecta.com.br/**`
4. Authentication > Email Templates: troque o conteúdo de **Magic Link** e **Confirm signup** por `supabase/templates/link.html`, e o de **Invite user** por `supabase/templates/convite.html`. O link usa `/auth/confirm?token_hash=...`, que funciona mesmo quando a pessoa abre o e-mail em outro aparelho.
5. Authentication > SMTP: configure o SMTP do Resend (o e-mail padrão do Supabase só manda poucos e-mails por hora).
6. Depois do primeiro login da Jess, torne a conta admin no SQL Editor:
   ```sql
   update members set status = 'aprovado', is_admin = true where email = 'email-da-jess@exemplo.com';
   ```

### 2. Vercel

1. Importe este repositório na Vercel (plano Hobby).
2. Variáveis de ambiente (veja `.env.example`):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `CADASTRO_ORIGENS`, `NEXT_PUBLIC_LANDING_URL`, `NEXT_PUBLIC_GRUPO_WHATSAPP`.
3. Domínio: aponte `app.direitaconecta.com.br` (CNAME na Cloudflare) para a Vercel.

### 3. Agendamento (GitHub Actions)

O plano Hobby da Vercel só roda cron uma vez por dia, então o aviso de mensagens não lidas roda pelo GitHub Actions de hora em hora (`.github/workflows/agendamento.yml`). Em Settings > Secrets and variables > Actions, crie `APP_URL` e `CRON_SECRET` (mesmo valor da Vercel).

### 4. Importar a planilha

```bash
cp .env.example .env.local   # preencha URL, service role e site
npm run import:planilha -- Cadastros.csv --teste   # confere a leitura
npm run import:planilha -- Cadastros.csv           # importa e manda o convite
```

Cada linha vira membro aprovado e recebe o e-mail de convite com o link de acesso. Pode rodar de novo sem duplicar.

### 5. Landing atual (Cloudflare Pages)

O formulário da landing pode passar a criar o membro direto no Supabase: troque o envio para o Apps Script por um `POST` em `https://app.direitaconecta.com.br/api/cadastro` com `nome`, `whatsapp`, `email`, `cidade`, `uf`, `perfis` (lista ou texto) e `aceite`. A resposta traz `grupo` com o link do WhatsApp para manter o fluxo de hoje. A origem da landing precisa estar em `CADASTRO_ORIGENS`.

## Desenvolvimento local

Precisa de Node 22 e Docker.

```bash
npm install
npx supabase start          # sobe Postgres, Auth, Storage, Realtime e o Mailpit
cp .env.example .env.local  # use a API URL, anon key e service_role key que o comando mostrou
npm run dev
```

Como o cadastro fica na landing, crie a conta de teste simulando o envio do formulário:

```bash
curl -X POST http://localhost:3000/api/cadastro -H "Content-Type: application/json" \
  -d '{"nome":"Seu Nome","whatsapp":"31999999999","email":"voce@exemplo.com","cidade":"Belo Horizonte","uf":"MG","perfis":["empresario"],"aceite":true}'
```

E-mails de teste (links mágicos) chegam no Mailpit em http://127.0.0.1:54324. Para virar admin localmente:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "update members set status='aprovado', is_admin=true where email='voce@exemplo.com'"
```

Antes de subir código: `npm run lint && npm run typecheck && npm run build`.

## Decisões em aberto do PRD (como ficou no código)

- Limite de propostas por oportunidade: 15 (gatilho `preparar_proposta`).
- Orçamento: faixas fixas (até 1 mil, 1 a 5 mil, 5 a 20 mil, acima) mais a opção "Outro valor" com campo livre.
- Princípios e LGPD: ficam na landing, onde está o formulário de cadastro.
- Aprovação: só a admin (`is_admin`). Um segundo admin é só marcar `is_admin = true` em outro membro.
- "Procuro vaga": não há tipo de oportunidade para isso; a narrativa segue networking e negócios.
