"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirMembro } from "@/lib/auth";
import { LIMITE_CATEGORIAS } from "@/lib/constantes";
import { textoOuNulo } from "@/lib/formato";
import { arquivoValido, enviarAvatar } from "@/lib/upload";

export type EstadoPasso = { erro?: string; ok?: number };

export async function salvarFotoTitulo(_: EstadoPasso, form: FormData): Promise<EstadoPasso> {
  const { supabase, membro } = await exigirMembro();
  const titulo = textoOuNulo(form.get("titulo"));
  if (!titulo || titulo.length < 3) return { erro: "Escreva um título curto, como \"Contador em BH\"" };
  if (titulo.length > 80) return { erro: "O título pode ter até 80 caracteres" };

  const mudancas: Record<string, unknown> = { titulo, bio: textoOuNulo(form.get("bio")) };
  const foto = form.get("foto");
  if (arquivoValido(foto)) {
    try {
      mudancas.foto_url = await enviarAvatar(supabase, membro.id, foto);
    } catch (e) {
      return { erro: (e as Error).message };
    }
  }
  const { error } = await supabase.from("members").update(mudancas).eq("id", membro.id);
  if (error) return { erro: "Não foi possível salvar. Tente de novo." };
  return { ok: 1 };
}

export async function salvarCategorias(_: EstadoPasso, form: FormData): Promise<EstadoPasso> {
  const { supabase, membro } = await exigirMembro();
  const escolhidas = form.getAll("categorias").map(String).slice(0, LIMITE_CATEGORIAS);
  if (escolhidas.length === 0) return { erro: "Escolha ao menos uma categoria" };
  const { error } = await supabase.from("members").update({ categorias: escolhidas }).eq("id", membro.id);
  if (error) return { erro: "Não foi possível salvar. Tente de novo." };
  return { ok: 2 };
}

// Usar com .bind(null, "servico" | "inicio").
export async function concluirOnboarding(destino: "servico" | "inicio") {
  const { supabase, membro } = await exigirMembro();
  await supabase.from("members").update({ onboarding_em: new Date().toISOString() }).eq("id", membro.id);
  revalidatePath("/", "layout");
  redirect(destino === "servico" ? "/perfil/servicos/novo" : "/inicio");
}
