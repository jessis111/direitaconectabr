"use server";

import { redirect } from "next/navigation";
import { exigirMembro } from "@/lib/auth";
import { avisarProposta } from "@/lib/email";
import { numeroOuNulo, textoOuNulo } from "@/lib/formato";
import { createAdminClient } from "@/lib/supabase/admin";

export type EstadoPedido = { erro?: string };

// "Pedir proposta" num serviço: vira proposta para o dono e já abre a conversa.
export async function pedirProposta(_: EstadoPedido, form: FormData): Promise<EstadoPedido> {
  const { supabase, membro } = await exigirMembro();
  const servicoId = String(form.get("servico_id") ?? "");
  const mensagem = String(form.get("mensagem") ?? "").trim();
  if (!servicoId) return { erro: "Escolha o serviço" };
  if (mensagem.length < 10) return { erro: "Conte em poucas palavras o que você precisa" };

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      servico_id: servicoId,
      mensagem: mensagem.slice(0, 2000),
      valor: numeroOuNulo(form.get("valor")),
      prazo: textoOuNulo(form.get("prazo"))?.slice(0, 80) ?? null,
    })
    .select("id, para_id")
    .single();
  if (error || !data) {
    if (error?.code === "23514") return { erro: "Você não pode pedir proposta para você mesmo." };
    return { erro: "Não foi possível enviar o pedido. Tente de novo." };
  }

  // A conversa é criada por gatilho; só aparece numa consulta depois do insert.
  const { data: conversa } = await supabase.from("conversations").select("id").eq("proposta_id", data.id).maybeSingle();
  const conversaId = conversa?.id;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const [{ data: para }, { data: servico }] = await Promise.all([
      admin.from("members").select("email").eq("id", data.para_id).single(),
      admin.from("services").select("nome").eq("id", servicoId).single(),
    ]);
    if (para?.email && servico) {
      await avisarProposta({
        para: para.email,
        deNome: membro.nome,
        titulo: servico.nome,
        url: conversaId ? `/conversas/${conversaId}` : "/conversas",
        pedidoServico: true,
      });
    }
  }

  redirect(conversaId ? `/conversas/${conversaId}` : "/conversas");
}
