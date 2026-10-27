-- Direita Conecta BR · esquema do MVP
-- Oito tabelas com RLS: members, services, opportunities, proposals,
-- conversations, messages, categories, reports.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type public.member_status as enum ('pendente', 'aprovado', 'bloqueado');
create type public.member_perfil as enum ('empresario', 'prestador', 'profissional');
create type public.opportunity_tipo as enum ('geral', 'campanha_ugc');
create type public.opportunity_status as enum ('aberta', 'em_conversa', 'fechada');
create type public.report_alvo as enum ('oportunidade', 'membro', 'servico');

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  ordem int not null default 0,
  ativa boolean not null default true,
  campos_extras jsonb
);

create table public.members (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  whatsapp text,
  telefone text,
  email text not null,
  cidade text,
  uf char(2),
  perfis public.member_perfil[] not null default '{}',
  titulo text check (char_length(titulo) <= 80),
  bio text check (char_length(bio) <= 500),
  foto_url text,
  instagram text,
  site text,
  categorias uuid[] not null default '{}' check (cardinality(categorias) <= 5),
  oferece_servicos boolean not null default false,
  status public.member_status not null default 'pendente',
  is_admin boolean not null default false,
  aceite_em timestamptz,
  onboarding_em timestamptz,
  ultimo_acesso_em timestamptz,
  criado_em timestamptz not null default now(),
  -- Perfil incompleto não aparece na busca (PRD, onboarding).
  perfil_completo boolean generated always as (
    coalesce(char_length(titulo), 0) > 0 and cardinality(categorias) > 0
  ) stored
);

create index members_status_idx on public.members (status);
create index members_uf_cidade_idx on public.members (uf, cidade);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  membro_id uuid not null references public.members (id) on delete cascade,
  categoria_id uuid not null references public.categories (id),
  nome text not null check (char_length(nome) between 3 and 80),
  descricao text check (char_length(descricao) <= 300),
  preco_min numeric(12, 2) check (preco_min >= 0),
  preco_max numeric(12, 2) check (preco_max >= 0),
  ativo boolean not null default true,
  -- Só para a categoria ugc_creator
  nichos text[] not null default '{}' check (cardinality(nichos) <= 3),
  formatos text[] not null default '{}',
  remoto boolean,
  tiktok text,
  portfolio jsonb not null default '[]' check (jsonb_typeof(portfolio) = 'array' and jsonb_array_length(portfolio) <= 6),
  criado_em timestamptz not null default now(),
  check (preco_max is null or preco_min is null or preco_max >= preco_min)
);

create index services_membro_idx on public.services (membro_id);
create index services_categoria_idx on public.services (categoria_id) where ativo;

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references public.members (id) on delete cascade,
  tipo public.opportunity_tipo not null default 'geral',
  titulo text not null check (char_length(titulo) between 5 and 120),
  descricao text not null check (char_length(descricao) between 10 and 3000),
  categoria_id uuid not null references public.categories (id),
  cidade text,
  uf char(2),
  remoto boolean not null default false,
  orcamento_min numeric(12, 2) check (orcamento_min >= 0),
  orcamento_max numeric(12, 2) check (orcamento_max >= 0),
  prazo date,
  entregas int check (entregas > 0),
  status public.opportunity_status not null default 'aberta',
  fechada_com_id uuid references public.members (id) on delete set null,
  fechada_em timestamptz,
  -- Total de propostas (as propostas são privadas; o número é público para membros).
  num_propostas int not null default 0,
  criado_em timestamptz not null default now(),
  check (orcamento_max is null or orcamento_min is null or orcamento_max >= orcamento_min)
);

create index opportunities_status_idx on public.opportunities (status, criado_em desc);
create index opportunities_autor_idx on public.opportunities (autor_id);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  oportunidade_id uuid references public.opportunities (id) on delete cascade,
  servico_id uuid references public.services (id) on delete cascade,
  de_id uuid not null references public.members (id) on delete cascade,
  para_id uuid not null references public.members (id) on delete cascade,
  mensagem text not null check (char_length(mensagem) between 10 and 2000),
  valor numeric(12, 2) check (valor >= 0),
  prazo text check (char_length(prazo) <= 80),
  criado_em timestamptz not null default now(),
  lida_em timestamptz,
  check ((oportunidade_id is null) <> (servico_id is null)),
  check (de_id <> para_id)
);

-- Uma proposta por membro em cada oportunidade.
create unique index proposals_unica_por_oportunidade on public.proposals (oportunidade_id, de_id)
  where oportunidade_id is not null;
create index proposals_para_idx on public.proposals (para_id, criado_em desc);
create index proposals_de_idx on public.proposals (de_id, criado_em desc);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null unique references public.proposals (id) on delete cascade,
  membro_a_id uuid not null references public.members (id) on delete cascade,
  membro_b_id uuid not null references public.members (id) on delete cascade,
  ultima_msg_em timestamptz,
  criado_em timestamptz not null default now()
);

create index conversations_a_idx on public.conversations (membro_a_id);
create index conversations_b_idx on public.conversations (membro_b_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.conversations (id) on delete cascade,
  de_id uuid not null references public.members (id) on delete cascade,
  texto text check (char_length(texto) <= 4000),
  imagem_url text,
  criado_em timestamptz not null default now(),
  lida_em timestamptz,
  notificado_em timestamptz,
  check (texto is not null or imagem_url is not null)
);

create index messages_conversa_idx on public.messages (conversa_id, criado_em);
create index messages_nao_lidas_idx on public.messages (criado_em) where lida_em is null and notificado_em is null;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  denunciante_id uuid not null references public.members (id) on delete cascade,
  alvo_tipo public.report_alvo not null,
  alvo_id uuid not null,
  motivo text not null check (char_length(motivo) between 5 and 1000),
  resolvido boolean not null default false,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Funções auxiliares (security definer para não cair em recursão de RLS)
-- ---------------------------------------------------------------------------

create or replace function public.is_approved()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where id = auth.uid() and status = 'aprovado');
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where id = auth.uid() and is_admin and status = 'aprovado');
$$;

create or replace function public.in_conversation(conversa uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversations c
    where c.id = conversa and auth.uid() in (c.membro_a_id, c.membro_b_id)
  );
$$;

-- WhatsApp e telefone só depois que existe conversa aberta entre os dois.
create or replace function public.contato_membro(alvo uuid)
returns table (whatsapp text, telefone text)
language sql stable security definer set search_path = public as $$
  select m.whatsapp, m.telefone
  from public.members m
  where m.id = alvo
    and public.is_approved()
    and (
      alvo = auth.uid()
      or public.is_admin()
      or exists (
        select 1 from public.conversations c
        where (c.membro_a_id = auth.uid() and c.membro_b_id = alvo)
           or (c.membro_b_id = auth.uid() and c.membro_a_id = alvo)
      )
    );
$$;

-- Dados privados do próprio membro (e-mail, WhatsApp, telefone).
create or replace function public.meus_dados()
returns table (email text, whatsapp text, telefone text)
language sql stable security definer set search_path = public as $$
  select email, whatsapp, telefone from public.members where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Gatilhos
-- ---------------------------------------------------------------------------

-- Cria o membro (pendente) quando o usuário se cadastra pelo link mágico.
-- O status nunca vem dos metadados: só a admin ou o script de importação muda.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  perfis public.member_perfil[];
begin
  select coalesce(array_agg(p::public.member_perfil), '{}')
    into perfis
    from jsonb_array_elements_text(coalesce(meta -> 'perfis', '[]'::jsonb)) p
    where p in ('empresario', 'prestador', 'profissional');

  insert into public.members (id, nome, email, whatsapp, cidade, uf, perfis, aceite_em)
  values (
    new.id,
    coalesce(nullif(trim(meta ->> 'nome'), ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(regexp_replace(coalesce(meta ->> 'whatsapp', ''), '\D', '', 'g'), ''),
    nullif(trim(meta ->> 'cidade'), ''),
    nullif(upper(trim(meta ->> 'uf')), ''),
    perfis,
    case when coalesce(meta ->> 'aceite', '') in ('true', '1') then now() end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Até 5 serviços por membro.
create or replace function public.limite_servicos()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.services where membro_id = new.membro_id) >= 5 then
    raise exception 'Limite de 5 serviços por membro';
  end if;
  return new;
end;
$$;

create trigger services_limite before insert on public.services
  for each row execute function public.limite_servicos();

-- Mantém members.oferece_servicos em dia com os serviços ativos.
create or replace function public.sync_oferece_servicos()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  alvo uuid := coalesce(new.membro_id, old.membro_id);
begin
  update public.members
     set oferece_servicos = exists (select 1 from public.services where membro_id = alvo and ativo)
   where id = alvo;
  return null;
end;
$$;

create trigger services_sync_membro after insert or update or delete on public.services
  for each row execute function public.sync_oferece_servicos();

-- Proposta: o destinatário é sempre o autor da oportunidade ou o dono do
-- serviço; limite de 15 propostas por oportunidade; pedido em serviço já
-- abre a conversa.
create or replace function public.preparar_proposta()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  dono uuid;
  situacao public.opportunity_status;
begin
  new.de_id := coalesce(auth.uid(), new.de_id);
  if new.oportunidade_id is not null then
    select autor_id, status into dono, situacao from public.opportunities where id = new.oportunidade_id;
    if dono is null then raise exception 'Oportunidade não encontrada'; end if;
    if situacao = 'fechada' then raise exception 'Esta oportunidade já foi fechada'; end if;
    if (select num_propostas from public.opportunities where id = new.oportunidade_id) >= 15 then
      raise exception 'Esta oportunidade já recebeu o limite de 15 propostas';
    end if;
  else
    select membro_id into dono from public.services where id = new.servico_id and ativo;
    if dono is null then raise exception 'Serviço não encontrado'; end if;
  end if;
  new.para_id := dono;
  new.criado_em := now();
  new.lida_em := null;
  return new;
end;
$$;

create trigger proposals_preparar before insert on public.proposals
  for each row execute function public.preparar_proposta();

create or replace function public.conversa_de_pedido()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.servico_id is not null then
    insert into public.conversations (proposta_id, membro_a_id, membro_b_id)
    values (new.id, new.de_id, new.para_id)
    on conflict (proposta_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger proposals_conversa after insert on public.proposals
  for each row execute function public.conversa_de_pedido();

create or replace function public.contar_propostas()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.oportunidade_id is not null then
    update public.opportunities set num_propostas = num_propostas + 1 where id = new.oportunidade_id;
  elsif tg_op = 'DELETE' and old.oportunidade_id is not null then
    update public.opportunities set num_propostas = greatest(num_propostas - 1, 0) where id = old.oportunidade_id;
  end if;
  return null;
end;
$$;

create trigger proposals_contar after insert or delete on public.proposals
  for each row execute function public.contar_propostas();

-- Mensagem nova atualiza a conversa; remetente é sempre quem está logado.
create or replace function public.preparar_mensagem()
returns trigger language plpgsql as $$
begin
  new.de_id := coalesce(auth.uid(), new.de_id);
  new.criado_em := now();
  new.lida_em := null;
  new.notificado_em := null;
  return new;
end;
$$;

create trigger messages_preparar before insert on public.messages
  for each row execute function public.preparar_mensagem();

create or replace function public.tocar_conversa()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set ultima_msg_em = new.criado_em where id = new.conversa_id;
  return null;
end;
$$;

create trigger messages_tocar after insert on public.messages
  for each row execute function public.tocar_conversa();

-- Oportunidade: autor é quem está logado; ao fechar, registra a data.
create or replace function public.preparar_oportunidade()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.autor_id := coalesce(auth.uid(), new.autor_id);
    new.status := 'aberta';
    new.criado_em := now();
    new.fechada_com_id := null;
    new.num_propostas := 0;
  else
    new.autor_id := old.autor_id;
    new.criado_em := old.criado_em;
    -- Contador só muda pelo gatilho de propostas.
    if pg_trigger_depth() = 1 then
      new.num_propostas := old.num_propostas;
    end if;
  end if;
  if new.status = 'fechada' and (tg_op = 'INSERT' or old.status <> 'fechada') then
    new.fechada_em := now();
  elsif new.status <> 'fechada' then
    new.fechada_em := null;
    new.fechada_com_id := null;
  end if;
  return new;
end;
$$;

create trigger opportunities_preparar before insert or update on public.opportunities
  for each row execute function public.preparar_oportunidade();

-- Serviço: dono é quem está logado.
create or replace function public.preparar_servico()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.membro_id := coalesce(auth.uid(), new.membro_id);
  else
    new.membro_id := old.membro_id;
  end if;
  return new;
end;
$$;

create trigger services_preparar before insert or update on public.services
  for each row execute function public.preparar_servico();

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- O autor da oportunidade abre conversa com quem mandou a proposta.
create or replace function public.abrir_conversa(proposta uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  p public.proposals;
  conversa uuid;
begin
  select * into p from public.proposals where id = proposta;
  if p.id is null or p.para_id <> auth.uid() or not public.is_approved() then
    raise exception 'Proposta não encontrada';
  end if;

  insert into public.conversations (proposta_id, membro_a_id, membro_b_id)
  values (p.id, p.para_id, p.de_id)
  on conflict (proposta_id) do update set proposta_id = excluded.proposta_id
  returning id into conversa;

  update public.proposals set lida_em = coalesce(lida_em, now()) where id = p.id;
  if p.oportunidade_id is not null then
    update public.opportunities set status = 'em_conversa'
     where id = p.oportunidade_id and status = 'aberta';
  end if;
  return conversa;
end;
$$;

-- Marca como lidas as mensagens do outro membro numa conversa.
create or replace function public.marcar_lidas(conversa uuid)
returns void language sql security definer set search_path = public as $$
  update public.messages set lida_em = now()
   where conversa_id = conversa
     and de_id <> auth.uid()
     and lida_em is null
     and public.in_conversation(conversa);
$$;

-- Registra o último acesso (métrica de membros ativos).
create or replace function public.registrar_acesso()
returns void language sql security definer set search_path = public as $$
  update public.members set ultimo_acesso_em = now()
   where id = auth.uid()
     and (ultimo_acesso_em is null or ultimo_acesso_em < now() - interval '1 hour');
$$;

-- Fecha oportunidades com mais de 60 dias (chamado pelo agendamento).
create or replace function public.fechar_oportunidades_antigas()
returns int language sql security definer set search_path = public as $$
  with fechadas as (
    update public.opportunities set status = 'fechada'
     where status <> 'fechada' and criado_em < now() - interval '60 days'
    returning 1
  )
  select count(*)::int from fechadas;
$$;

-- Admin aprova ou bloqueia membros (um ou vários de uma vez).
create or replace function public.admin_definir_status(membros uuid[], novo public.member_status)
returns int language plpgsql security definer set search_path = public as $$
declare
  total int;
begin
  if not public.is_admin() then raise exception 'Acesso restrito'; end if;
  update public.members set status = novo
   where id = any(membros) and id <> auth.uid();
  get diagnostics total = row_count;
  return total;
end;
$$;

-- Painel da admin.
create or replace function public.painel_admin()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Acesso restrito'; end if;
  return jsonb_build_object(
    'membros_aprovados', (select count(*) from members where status = 'aprovado'),
    'membros_pendentes', (select count(*) from members where status = 'pendente'),
    'perfis_completos', (select count(*) from members where status = 'aprovado' and perfil_completo),
    'ativos_30_dias', (select count(*) from members where status = 'aprovado' and ultimo_acesso_em > now() - interval '30 days'),
    'oportunidades_abertas', (select count(*) from opportunities where status <> 'fechada'),
    'oportunidades_semana', (select count(*) from opportunities where criado_em > now() - interval '7 days'),
    'propostas_semana', (select count(*) from proposals where criado_em > now() - interval '7 days'),
    'oportunidades_com_proposta', (select count(*) from opportunities where num_propostas > 0),
    'oportunidades_total', (select count(*) from opportunities),
    'negocios_fechados', (select count(*) from opportunities where fechada_com_id is not null),
    'denuncias_abertas', (select count(*) from reports where not resolvido)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Privilégios por coluna: e-mail, WhatsApp e telefone nunca saem pela API
-- direta; status e is_admin só mudam pela admin.
-- ---------------------------------------------------------------------------

revoke all on public.members from anon, authenticated;
grant select (
  id, nome, cidade, uf, perfis, titulo, bio, foto_url, instagram, site,
  categorias, oferece_servicos, status, is_admin, onboarding_em, criado_em, perfil_completo
) on public.members to authenticated;
grant update (
  nome, whatsapp, telefone, cidade, uf, perfis, titulo, bio, foto_url,
  instagram, site, categorias, onboarding_em
) on public.members to authenticated;

revoke all on public.categories from anon, authenticated;
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

revoke all on public.services, public.opportunities, public.proposals,
  public.conversations, public.messages, public.reports from anon;

revoke update on public.proposals from authenticated;
grant update (lida_em) on public.proposals to authenticated;
revoke update on public.messages from authenticated;
revoke insert, update on public.conversations from authenticated;
revoke update on public.reports from authenticated;
grant update (resolvido) on public.reports to authenticated;

grant execute on function public.contato_membro(uuid), public.meus_dados(),
  public.abrir_conversa(uuid), public.marcar_lidas(uuid), public.registrar_acesso(),
  public.painel_admin(), public.admin_definir_status(uuid[], public.member_status),
  public.is_approved(), public.is_admin(), public.in_conversation(uuid)
  to authenticated;
revoke execute on function public.fechar_oportunidades_antigas() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.members enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.opportunities enable row level security;
alter table public.proposals enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

-- members
create policy members_select on public.members for select to authenticated
  using (id = auth.uid() or public.is_admin() or (status = 'aprovado' and public.is_approved()));
create policy members_update_proprio on public.members for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy members_delete_admin on public.members for delete to authenticated
  using (public.is_admin());

-- categories
create policy categories_select on public.categories for select to anon, authenticated
  using (ativa or public.is_admin());
create policy categories_admin on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- services
create policy services_select on public.services for select to authenticated
  using (membro_id = auth.uid() or public.is_admin() or (ativo and public.is_approved()));
create policy services_insert on public.services for insert to authenticated
  with check (public.is_approved());
create policy services_update on public.services for update to authenticated
  using (membro_id = auth.uid()) with check (membro_id = auth.uid());
create policy services_delete on public.services for delete to authenticated
  using (membro_id = auth.uid() or public.is_admin());

-- opportunities
create policy opportunities_select on public.opportunities for select to authenticated
  using (public.is_approved());
create policy opportunities_insert on public.opportunities for insert to authenticated
  with check (public.is_approved());
create policy opportunities_update on public.opportunities for update to authenticated
  using (autor_id = auth.uid() and public.is_approved()) with check (autor_id = auth.uid());
create policy opportunities_delete on public.opportunities for delete to authenticated
  using (autor_id = auth.uid() or public.is_admin());

-- proposals
create policy proposals_select on public.proposals for select to authenticated
  using (auth.uid() in (de_id, para_id) or public.is_admin());
create policy proposals_insert on public.proposals for insert to authenticated
  with check (public.is_approved());
create policy proposals_update on public.proposals for update to authenticated
  using (para_id = auth.uid()) with check (para_id = auth.uid());

-- conversations (criadas só por gatilho ou pela RPC abrir_conversa)
create policy conversations_select on public.conversations for select to authenticated
  using (auth.uid() in (membro_a_id, membro_b_id));

-- messages
create policy messages_select on public.messages for select to authenticated
  using (public.in_conversation(conversa_id));
create policy messages_insert on public.messages for insert to authenticated
  with check (public.is_approved() and public.in_conversation(conversa_id));

-- reports
create policy reports_insert on public.reports for insert to authenticated
  with check (public.is_approved() and denunciante_id = auth.uid());
create policy reports_admin_select on public.reports for select to authenticated
  using (public.is_admin());
create policy reports_admin_update on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Realtime do chat
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
