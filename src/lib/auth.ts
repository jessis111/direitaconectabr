import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { COLUNAS_MEMBRO, type Membro } from "./types";

// Usuário logado e sua linha em members (uma vez por requisição).
export const sessaoAtual = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, membro: null };
  const { data } = await supabase.from("members").select(COLUNAS_MEMBRO).eq("id", user.id).maybeSingle();
  return { supabase, user, membro: (data as Membro | null) ?? null };
});

// Garante membro aprovado; manda pendentes e bloqueados para a tela certa.
export async function exigirMembro() {
  const sessao = await sessaoAtual();
  if (!sessao.user) redirect("/entrar");
  if (!sessao.membro || sessao.membro.status !== "aprovado") redirect("/aguardando");
  return sessao as typeof sessao & { membro: Membro; user: NonNullable<typeof sessao.user> };
}

export async function exigirAdmin() {
  const sessao = await exigirMembro();
  if (!sessao.membro.is_admin) redirect("/inicio");
  return sessao;
}
