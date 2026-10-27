-- Buckets do Supabase Storage
-- avatars e portfolio: leitura pública (as URLs aparecem só dentro da área de membros).
-- chat: privado, só os dois membros da conversa leem (URL assinada).
-- Caminhos: avatars/<membro_id>/arquivo, portfolio/<membro_id>/arquivo, chat/<conversa_id>/arquivo

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('portfolio', 'portfolio', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']),
  ('chat', 'chat', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "avatars: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: dono atualiza" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "portfolio: aprovado envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and public.is_approved() and (storage.foldername(name))[1] = auth.uid()::text);
create policy "portfolio: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "chat: conversa envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat' and public.is_approved() and public.in_conversation(((storage.foldername(name))[1])::uuid));
create policy "chat: conversa lê" on storage.objects for select to authenticated
  using (bucket_id = 'chat' and public.in_conversation(((storage.foldername(name))[1])::uuid));
