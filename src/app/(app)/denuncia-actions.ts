"use server";

import { exigirMembro } from "@/lib/auth";

export type EstadoDenuncia = { erro?: string; ok?: boolean };

export async function denunciar(_: EstadoDenuncia, form: FormData): Promise<EstadoDenuncia> {
  const { supabase, membro } = await exigirMembro();
  const alvoTipo = String(form.get("alvo_tipo"));
  const motivo = String(form.get("motivo") ?? "").trim();
  if (!["oportunidade", "membro", "servico"].includes(alvoTipo)) return { erro: "Denúncia inválida" };
  if (motivo.length < 5) return { erro: "Conte o motivo em poucas palavras" };
  const { error } = await supabase.from("reports").insert({
    denunciante_id: membro.id,
    alvo_tipo: alvoTipo,
    alvo_id: String(form.get("alvo_id")),
    motivo: motivo.slice(0, 1000),
  });
  if (error) return { erro: "Não foi possível enviar a denúncia" };
  return { ok: true };
}
