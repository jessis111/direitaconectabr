"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirMembro } from "@/lib/auth";
import { FAIXAS_ORCAMENTO } from "@/lib/constantes";
import { categorias } from "@/lib/dados";
import { avisarProposta } from "@/lib/email";
import { numeroOuNulo, textoOuNulo } from "@/lib/formato";
import { createAdminClient } from "@/lib/supabase/admin";

export type EstadoForm = { erro?: string; ok?: boolean };

const oportunidadeSchema = z.object({
  tipo: z.enum(["geral", "campanha_ugc"]),
  titulo: z.string().trim().min(5, "Título com pelo menos 5 letras").max(120),
  descricao: z.string().trim().min(10, "Conte um pouco mais na descrição").max(3000),
  categoria_id: z.string().uuid("Escolha a categoria"),
  remoto: z.boolean(),
  cidade: z.string().trim().max(80).nullable(),
  uf: z.string().length(2).nullable(),
  prazo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  entregas: z.number().int().positive().max(1000).nullable(),
});

export async function publicarOportunidade(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const { supabase } = await exigirMembro();
  const { ugc } = await categorias();
  const tipo = form.get("tipo") === "campanha_ugc" ? "campanha_ugc" : "geral";
  const remoto = form.get("remoto") === "on";

  const parsed = oportunidadeSchema.safeParse({
    tipo,
    titulo: form.get("titulo"),
    descricao: form.get("descricao"),
    categoria_id: tipo === "campanha_ugc" ? ugc?.id : form.get("categoria_id"),
    remoto,
    cidade: textoOuNulo(form.get("cidade")),
    uf: textoOuNulo(form.get("uf")),
    prazo: textoOuNulo(form.get("prazo")),
    entregas: tipo === "campanha_ugc" ? numeroOuNulo(form.get("entregas")) : null,
  });
  if (!parsed.success) return { erro: parsed.error.issues[0].message };
  if (!parsed.data.remoto && (!parsed.data.cidade || !parsed.data.uf)) {
    return { erro: "Informe cidade e estado, ou marque como remoto" };
  }

  let orcamento_min: number | null = null;
  let orcamento_max: number | null = null;
  const faixa = String(form.get("faixa") ?? "");
  if (faixa === "livre") {
    orcamento_min = numeroOuNulo(form.get("orcamento_min"));
    orcamento_max = numeroOuNulo(form.get("orcamento_max"));
    if (orcamento_min != null && orcamento_max != null && orcamento_max < orcamento_min) {
      return { erro: "O valor máximo precisa ser maior que o mínimo" };
    }
  } else if (faixa !== "") {
    const f = FAIXAS_ORCAMENTO[Number(faixa)];
    if (f) {
      orcamento_min = f.min || null;
      orcamento_max = f.max;
    }
  }

  const { data, error } = await supabase
    .from("opportunities")
    .insert({ ...parsed.data, orcamento_min, orcamento_max })
    .select("id")
    .single();
  if (error || !data) return { erro: "Não foi possível publicar. Tente de novo." };

  revalidatePath("/oportunidades");
  revalidatePath("/inicio");
  redirect(`/oportunidades/${data.id}`);
}

export async function enviarProposta(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const { supabase, membro } = await exigirMembro();
  const oportunidadeId = String(form.get("oportunidade_id"));
  const mensagem = String(form.get("mensagem") ?? "").trim();
  if (mensagem.length < 10) return { erro: "Escreva uma mensagem com pelo menos 10 letras" };

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      oportunidade_id: oportunidadeId,
      mensagem: mensagem.slice(0, 2000),
      valor: numeroOuNulo(form.get("valor")),
      prazo: textoOuNulo(form.get("prazo"))?.slice(0, 80) ?? null,
    })
    .select("para_id")
    .single();
  if (error || !data) {
    if (error?.code === "23505") return { erro: "Você já mandou proposta nesta oportunidade." };
    return { erro: error?.message?.includes("limite") || error?.message?.includes("fechada") ? error.message : "Não foi possível enviar. Tente de novo." };
  }

  await notificarProposta(data.para_id, membro.nome, oportunidadeId);
  revalidatePath(`/oportunidades/${oportunidadeId}`);
  return { ok: true };
}

async function notificarProposta(paraId: string, deNome: string, oportunidadeId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const admin = createAdminClient();
  const [{ data: para }, { data: op }] = await Promise.all([
    admin.from("members").select("email").eq("id", paraId).single(),
    admin.from("opportunities").select("titulo").eq("id", oportunidadeId).single(),
  ]);
  if (para?.email && op) {
    await avisarProposta({ para: para.email, deNome, titulo: op.titulo, url: `/oportunidades/${oportunidadeId}`, pedidoServico: false });
  }
}

export async function abrirConversa(form: FormData) {
  const { supabase } = await exigirMembro();
  const { data, error } = await supabase.rpc("abrir_conversa", { proposta: String(form.get("proposta_id")) });
  if (error || !data) throw new Error("Não foi possível abrir a conversa");
  redirect(`/conversas/${data}`);
}

export async function mudarStatus(form: FormData) {
  const { supabase } = await exigirMembro();
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  if (!["aberta", "em_conversa", "fechada"].includes(status)) return;
  const fechadaCom = textoOuNulo(form.get("fechada_com_id"));
  await supabase
    .from("opportunities")
    .update({ status, fechada_com_id: status === "fechada" ? fechadaCom : null })
    .eq("id", id);
  revalidatePath(`/oportunidades/${id}`);
  revalidatePath("/oportunidades");
}

export async function excluirOportunidade(form: FormData) {
  const { supabase } = await exigirMembro();
  await supabase.from("opportunities").delete().eq("id", String(form.get("id")));
  revalidatePath("/oportunidades");
  redirect("/oportunidades?minhas=1");
}
