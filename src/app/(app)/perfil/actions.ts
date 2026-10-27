"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirMembro } from "@/lib/auth";
import { LIMITE_CATEGORIAS } from "@/lib/constantes";
import { soDigitos, textoOuNulo } from "@/lib/formato";
import { arquivoValido, enviarAvatar } from "@/lib/upload";

export type EstadoPerfil = { erro?: string; ok?: boolean };

const perfilSchema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome").max(120),
  titulo: z.string().trim().max(80, "Título com até 80 caracteres").nullable(),
  bio: z.string().trim().max(500, "Bio com até 500 caracteres").nullable(),
  cidade: z.string().trim().max(80).nullable(),
  uf: z.string().length(2).nullable(),
  perfis: z.array(z.enum(["empresario", "prestador", "profissional"])).min(1, "Escolha ao menos um perfil"),
  categorias: z.array(z.string().uuid()).max(LIMITE_CATEGORIAS, `Escolha até ${LIMITE_CATEGORIAS} categorias`),
  instagram: z.string().trim().max(120).nullable(),
  site: z.string().trim().max(200).nullable(),
  whatsapp: z.string().refine((v) => v.length >= 10 && v.length <= 13, "WhatsApp com DDD").nullable(),
  telefone: z.string().refine((v) => v.length >= 10 && v.length <= 13, "Telefone com DDD").nullable(),
});

export async function salvarPerfil(_: EstadoPerfil, form: FormData): Promise<EstadoPerfil> {
  const { supabase, membro } = await exigirMembro();
  const digitos = (k: string) => {
    const d = soDigitos(String(form.get(k) ?? ""));
    return d || null;
  };
  const parsed = perfilSchema.safeParse({
    nome: form.get("nome"),
    titulo: textoOuNulo(form.get("titulo")),
    bio: textoOuNulo(form.get("bio")),
    cidade: textoOuNulo(form.get("cidade")),
    uf: textoOuNulo(form.get("uf")),
    perfis: form.getAll("perfis"),
    categorias: form.getAll("categorias").map(String),
    instagram: textoOuNulo(form.get("instagram")),
    site: textoOuNulo(form.get("site")),
    whatsapp: digitos("whatsapp"),
    telefone: digitos("telefone"),
  });
  if (!parsed.success) return { erro: parsed.error.issues[0].message };

  const mudancas: Record<string, unknown> = { ...parsed.data };
  const foto = form.get("foto");
  if (arquivoValido(foto)) {
    try {
      mudancas.foto_url = await enviarAvatar(supabase, membro.id, foto);
    } catch (e) {
      return { erro: (e as Error).message };
    }
  }
  if (!membro.onboarding_em) mudancas.onboarding_em = new Date().toISOString();

  const { error } = await supabase.from("members").update(mudancas).eq("id", membro.id);
  if (error) return { erro: "Não foi possível salvar. Tente de novo." };
  revalidatePath("/", "layout");
  return { ok: true };
}
