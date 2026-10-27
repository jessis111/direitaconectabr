import { NextResponse, type NextRequest } from "next/server";
import { avisarMensagens } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

// Chamado de hora em hora pelo GitHub Actions (.github/workflows/agendamento.yml).
// 1. Fecha oportunidades com mais de 60 dias.
// 2. Avisa por e-mail quem tem mensagem sem leitura há mais de 1 hora (uma vez por mensagem).
export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return new NextResponse("Não autorizado", { status: 401 });
  }
  const admin = createAdminClient();

  const { data: fechadas } = await admin.rpc("fechar_oportunidades_antigas");

  const limite = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: pendentes } = await admin
    .from("messages")
    .select("id, de_id, conversa:conversations!inner(membro_a_id, membro_b_id)")
    .is("lida_em", null)
    .is("notificado_em", null)
    .lt("criado_em", limite)
    .limit(1000);

  type Linha = { id: string; de_id: string; conversa: { membro_a_id: string; membro_b_id: string } };
  const porDestino = new Map<string, { ids: string[]; de: Set<string> }>();
  for (const m of (pendentes ?? []) as unknown as Linha[]) {
    const para = m.conversa.membro_a_id === m.de_id ? m.conversa.membro_b_id : m.conversa.membro_a_id;
    const g = porDestino.get(para) ?? { ids: [], de: new Set<string>() };
    g.ids.push(m.id);
    g.de.add(m.de_id);
    porDestino.set(para, g);
  }

  let avisados = 0;
  if (porDestino.size) {
    const todos = [...new Set([...porDestino.keys(), ...[...porDestino.values()].flatMap((g) => [...g.de])])];
    const { data: membros } = await admin.from("members").select("id, nome, email, status").in("id", todos);
    const porId = new Map((membros ?? []).map((m) => [m.id, m]));

    for (const [para, g] of porDestino) {
      const destino = porId.get(para);
      if (destino?.status === "aprovado") {
        await avisarMensagens({
          para: destino.email,
          nome: destino.nome,
          quantidade: g.ids.length,
          de: [...g.de].map((id) => porId.get(id)?.nome ?? "Um membro"),
        });
        avisados++;
      }
      await admin.from("messages").update({ notificado_em: new Date().toISOString() }).in("id", g.ids);
    }
  }

  return NextResponse.json({ oportunidades_fechadas: fechadas ?? 0, membros_avisados: avisados });
}
