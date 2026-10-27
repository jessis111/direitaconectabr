import { NextResponse, type NextRequest } from "next/server";
import { sessaoAtual } from "@/lib/auth";
import { ROTULO_PERFIL } from "@/lib/constantes";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Perfil } from "@/lib/types";

function celula(v: unknown) {
  const s = v == null ? "" : String(v);
  // Evita fórmulas ao abrir no Excel/Sheets.
  const seguro = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[";\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

export async function GET(request: NextRequest) {
  const { membro } = await sessaoAtual();
  if (!membro?.is_admin || membro.status !== "aprovado") return new NextResponse("Acesso restrito", { status: 403 });

  const status = request.nextUrl.searchParams.get("status");
  let q = createAdminClient()
    .from("members")
    .select("nome, email, whatsapp, telefone, cidade, uf, perfis, titulo, status, criado_em, ultimo_acesso_em")
    .order("criado_em");
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return new NextResponse("Erro ao exportar", { status: 500 });

  const cabecalho = ["Nome", "E-mail", "WhatsApp", "Telefone", "Cidade", "UF", "Perfil", "Título", "Status", "Cadastro", "Último acesso"];
  const linhas = (data ?? []).map((m) =>
    [
      m.nome, m.email, m.whatsapp, m.telefone, m.cidade, m.uf,
      (m.perfis as Perfil[]).map((p) => ROTULO_PERFIL[p]).join(", "),
      m.titulo, m.status,
      new Date(m.criado_em).toLocaleString("pt-BR"),
      m.ultimo_acesso_em ? new Date(m.ultimo_acesso_em).toLocaleString("pt-BR") : "",
    ].map(celula).join(";"),
  );
  const csv = "﻿" + [cabecalho.join(";"), ...linhas].join("\n");
  const nome = `direita-conecta-membros-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${nome}"` },
  });
}
