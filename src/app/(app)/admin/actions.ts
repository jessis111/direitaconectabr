"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth";
import { avisarAprovacao } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

function ids(form: FormData) {
  return form.getAll("id").map(String).filter(Boolean);
}

// Usar com .bind(null, "aprovado"): vale para os ids marcados no formulário.
export async function definirStatus(status: string, form: FormData) {
  await mudarStatusMembros(status, ids(form));
}

// Usar com .bind(null, "aprovado", id): uma linha só.
export async function definirStatusDe(status: string, id: string) {
  await mudarStatusMembros(status, [id]);
}

async function mudarStatusMembros(status: string, lista: string[]) {
  const { supabase } = await exigirAdmin();
  if (!lista.length || !["aprovado", "bloqueado", "pendente"].includes(status)) return;

  // Só avisa quem estava pendente e passou a aprovado.
  const admin = createAdminClient();
  const { data: antes } = await admin.from("members").select("id, nome, email, status").in("id", lista);
  await supabase.rpc("admin_definir_status", { membros: lista, novo: status });

  if (status === "aprovado") {
    await Promise.all(
      (antes ?? [])
        .filter((m) => m.status === "pendente")
        .map((m) => avisarAprovacao({ para: m.email, nome: m.nome })),
    );
  }
  revalidatePath("/admin", "layout");
}

export async function removerMembro(form: FormData) {
  const { membro } = await exigirAdmin();
  const id = String(form.get("id"));
  if (!id || id === membro.id) return;
  // Apagar o usuário do Auth remove o membro e tudo dele em cascata.
  await createAdminClient().auth.admin.deleteUser(id);
  revalidatePath("/admin", "layout");
}

// Usar com .bind(null, "remover" | "ignorar", id).
export async function resolverDenuncia(acao: "remover" | "ignorar", id: string) {
  const { supabase } = await exigirAdmin();

  if (acao === "remover") {
    const { data: r } = await supabase.from("reports").select("alvo_tipo, alvo_id").eq("id", id).single();
    if (r?.alvo_tipo === "oportunidade") await supabase.from("opportunities").delete().eq("id", r.alvo_id);
    if (r?.alvo_tipo === "servico") await supabase.from("services").delete().eq("id", r.alvo_id);
    if (r?.alvo_tipo === "membro") await supabase.rpc("admin_definir_status", { membros: [r.alvo_id], novo: "bloqueado" });
  }
  await supabase.from("reports").update({ resolvido: true }).eq("id", id);
  revalidatePath("/admin", "layout");
}

function slugificar(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function salvarCategoria(form: FormData) {
  const { supabase } = await exigirAdmin();
  const id = String(form.get("id") ?? "");
  const nome = String(form.get("nome") ?? "").trim();
  const ordem = Number(form.get("ordem")) || 0;
  if (nome.length < 2) return;
  if (id) {
    await supabase.from("categories").update({ nome, ordem }).eq("id", id);
  } else {
    await supabase.from("categories").insert({ nome, ordem, slug: slugificar(nome) });
  }
  revalidatePath("/", "layout");
}

export async function alternarCategoria(form: FormData) {
  const { supabase } = await exigirAdmin();
  await supabase.from("categories").update({ ativa: form.get("ativa") === "1" }).eq("id", String(form.get("id")));
  revalidatePath("/", "layout");
}
