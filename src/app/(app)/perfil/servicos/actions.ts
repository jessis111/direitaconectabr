"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirMembro } from "@/lib/auth";
import { LIMITE_PORTFOLIO, LIMITE_SERVICOS } from "@/lib/constantes";
import { categorias } from "@/lib/dados";
import { numeroOuNulo, textoOuNulo } from "@/lib/formato";
import type { ItemPortfolio } from "@/lib/types";

export type EstadoServico = { erro?: string };

const TIPOS_MIDIA: Record<string, ItemPortfolio["tipo"]> = {
  "image/jpeg": "imagem",
  "image/png": "imagem",
  "image/webp": "imagem",
  "video/mp4": "video",
  "video/quicktime": "video",
  "video/webm": "video",
};

const servicoSchema = z.object({
  categoria_id: z.string().uuid("Escolha a categoria"),
  nome: z.string().trim().min(3, "Nome do serviço com pelo menos 3 letras").max(80),
  descricao: z.string().trim().max(300, "Descrição com até 300 caracteres").nullable(),
  preco_min: z.number().nullable(),
  preco_max: z.number().nullable(),
  ativo: z.boolean(),
});

function itensPortfolio(form: FormData): ItemPortfolio[] {
  const atuais: ItemPortfolio[] = [];
  for (const v of form.getAll("portfolio_atual")) {
    try {
      const item = JSON.parse(String(v)) as ItemPortfolio;
      if (item.url && ["video", "imagem", "link"].includes(item.tipo)) atuais.push({ url: item.url, tipo: item.tipo, capa_url: item.capa_url ?? null });
    } catch {}
  }
  for (const l of String(form.get("portfolio_links") ?? "").split(/\s+/)) {
    if (/^https?:\/\/\S+$/i.test(l)) atuais.push({ url: l, tipo: "link" });
  }
  return atuais;
}

// Upload direto do navegador para o Storage (vídeos são grandes); aqui só chegam as URLs.
function itensEnviados(form: FormData): ItemPortfolio[] {
  return form.getAll("portfolio_enviado").flatMap((v) => {
    try {
      const { url, tipo } = JSON.parse(String(v)) as { url: string; tipo: string };
      const t = TIPOS_MIDIA[tipo];
      return t && url ? [{ url, tipo: t }] : [];
    } catch {
      return [];
    }
  });
}

export async function salvarServico(_: EstadoServico, form: FormData): Promise<EstadoServico> {
  const { supabase, membro } = await exigirMembro();
  const { ugc } = await categorias();
  const id = textoOuNulo(form.get("id"));

  const parsed = servicoSchema.safeParse({
    categoria_id: form.get("categoria_id"),
    nome: form.get("nome"),
    descricao: textoOuNulo(form.get("descricao")),
    preco_min: numeroOuNulo(form.get("preco_min")),
    preco_max: numeroOuNulo(form.get("preco_max")),
    ativo: form.get("ativo") !== "off",
  });
  if (!parsed.success) return { erro: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.preco_min != null && d.preco_max != null && d.preco_max < d.preco_min) {
    return { erro: "O preço máximo precisa ser maior que o mínimo" };
  }

  const ehUgc = d.categoria_id === ugc?.id;
  const portfolio = ehUgc ? [...itensPortfolio(form), ...itensEnviados(form)] : [];
  if (portfolio.length > LIMITE_PORTFOLIO) return { erro: `Portfólio com até ${LIMITE_PORTFOLIO} itens` };
  // Só aceita arquivos do próprio membro no Storage.
  const pastaPropria = `/portfolio/${membro.id}/`;
  if (portfolio.some((p) => p.tipo !== "link" && !p.url.includes(pastaPropria))) return { erro: "Arquivo de portfólio inválido" };

  const nichos = ehUgc ? form.getAll("nichos").map(String).slice(0, 3) : [];
  const formatos = ehUgc ? form.getAll("formatos").map(String) : [];
  if (ehUgc && nichos.length === 0) return { erro: "Escolha ao menos um nicho" };
  if (ehUgc && formatos.length === 0) return { erro: "Escolha ao menos um formato" };

  const linha = {
    ...d,
    nichos,
    formatos,
    remoto: ehUgc ? form.get("modalidade") !== "presencial" : null,
    tiktok: ehUgc ? textoOuNulo(form.get("tiktok")) : null,
    portfolio,
  };

  if (id) {
    const { error } = await supabase.from("services").update(linha).eq("id", id).eq("membro_id", membro.id);
    if (error) return { erro: "Não foi possível salvar. Tente de novo." };
  } else {
    const { count } = await supabase.from("services").select("id", { count: "exact", head: true }).eq("membro_id", membro.id);
    if ((count ?? 0) >= LIMITE_SERVICOS) return { erro: `Você já tem ${LIMITE_SERVICOS} serviços. Remova um para cadastrar outro.` };
    const { error } = await supabase.from("services").insert(linha);
    if (error) return { erro: "Não foi possível salvar. Tente de novo." };
  }

  revalidatePath("/perfil/servicos");
  revalidatePath("/servicos");
  revalidatePath("/creators");
  redirect("/perfil/servicos");
}

export async function alternarServico(form: FormData) {
  const { supabase, membro } = await exigirMembro();
  await supabase
    .from("services")
    .update({ ativo: form.get("ativo") === "1" })
    .eq("id", String(form.get("id")))
    .eq("membro_id", membro.id);
  revalidatePath("/perfil/servicos");
  revalidatePath("/servicos");
  revalidatePath("/creators");
}

export async function excluirServico(form: FormData) {
  const { supabase, membro } = await exigirMembro();
  await supabase.from("services").delete().eq("id", String(form.get("id"))).eq("membro_id", membro.id);
  revalidatePath("/perfil/servicos");
  revalidatePath("/servicos");
  revalidatePath("/creators");
  redirect("/perfil/servicos");
}
