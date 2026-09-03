-- ============================================================
-- F7.1: Tablas del Chat IA
-- ============================================================
-- Conversaciones persistentes, mensajes y contexto de estudios.
-- Aislamiento por usuario vía RLS (auth.uid() = user_id).

-- ── chat_conversations ───────────────────────────────────────
-- Una conversación pertenece a un único usuario.
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nueva conversación',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índice para listar conversaciones por usuario
create index if not exists idx_chat_conversations_user_id
  on public.chat_conversations(user_id);

alter table public.chat_conversations enable row level security;

create policy "Users can insert own chat conversations"
  on public.chat_conversations for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can select own chat conversations"
  on public.chat_conversations for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own chat conversations"
  on public.chat_conversations for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own chat conversations"
  on public.chat_conversations for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger update_chat_conversations_updated_at
  before update on public.chat_conversations
  for each row
  execute function update_updated_at_column();

-- ── chat_messages ────────────────────────────────────────────
-- Mensajes dentro de una conversación (inmutables: no update).
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Índice para cargar mensajes en orden cronológico por conversación
create index if not exists idx_chat_messages_conversation
  on public.chat_messages(conversation_id, created_at);

alter table public.chat_messages enable row level security;

-- insert: verifica que la conversación pertenezca al usuario
create policy "Users can insert own chat messages"
  on public.chat_messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.chat_conversations
      where chat_conversations.id = chat_messages.conversation_id
        and chat_conversations.user_id = auth.uid()
    )
  );

create policy "Users can select own chat messages"
  on public.chat_messages for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own chat messages"
  on public.chat_messages for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own chat messages"
  on public.chat_messages for delete
  to authenticated
  using (auth.uid() = user_id);

-- ── chat_contexts ────────────────────────────────────────────
-- Estudios vinculados como contexto de una conversación.
-- UNIQUE(conversation_id, study_id) evita duplicados.
create table if not exists public.chat_contexts (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  study_id uuid not null references public.studies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (conversation_id, study_id)
);

-- Índice para cargar contextos de una conversación
create index if not exists idx_chat_contexts_conversation
  on public.chat_contexts(conversation_id);

alter table public.chat_contexts enable row level security;

-- insert: verifica que la conversación Y el estudio pertenezcan al usuario
create policy "Users can insert own chat contexts"
  on public.chat_contexts for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.chat_conversations
      where chat_conversations.id = chat_contexts.conversation_id
        and chat_conversations.user_id = auth.uid()
    )
    and exists (
      select 1 from public.studies
      where studies.id = chat_contexts.study_id
        and studies.user_id = auth.uid()
    )
  );

create policy "Users can select own chat contexts"
  on public.chat_contexts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own chat contexts"
  on public.chat_contexts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own chat contexts"
  on public.chat_contexts for delete
  to authenticated
  using (auth.uid() = user_id);
