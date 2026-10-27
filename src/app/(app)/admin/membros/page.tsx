import type { Metadata } from "next";
import Link from "next/link";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { Filtros } from "@/components/Filtros";
import { Tag } from "@/components/Tag";
import { Titulo } from "@/components/Titulo";
import { exigirAdmin } from "@/lib/auth";
import { formatarTelefone, local, tempoRelativo } from "@/lib/formato";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MemberStatus } from "@/lib/types";
import { definirStatusDe, removerMembro } from "../actions";
import { ConfirmarRemocao } from "./ConfirmarRemocao";

export const metadata: Metadata = { title: "Membros" };

type Linha = { id: string; nome: string; email: string; whatsapp: string | null; cidade: string | null; uf: string | null; status: MemberStatus; is_admin: boolean; perfil_completo: boolean; criado_em: string; ultimo_acesso_em: string | null };

const COR: Record<MemberStatus, "verde" | "amarela" | "apagada"> = { aprovado: "verde", pendente: "amarela", bloqueado: "apagada" };

export default async function MembrosAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const sp = await searchParams;
  const { membro: eu } = await exigirAdmin();
  let q = createAdminClient()
    .from("members")
    .select("id, nome, email, whatsapp, cidade, uf, status, is_admin, perfil_completo, criado_em, ultimo_acesso_em", { count: "exact" })
    .order("criado_em", { ascending: false })
    .limit(200);
  if (sp.status) q = q.eq("status", sp.status);
  if (sp.q) {
    const t = sp.q.replace(/[%,()]/g, " ").trim();
    if (t) q = q.or(`nome.ilike.%${t}%,email.ilike.%${t}%,cidade.ilike.%${t}%,whatsapp.ilike.%${t.replace(/\D/g, "") || t}%`);
  }
  const { data, count } = await q;
  const lista = (data ?? []) as Linha[];
  const exportar = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => !!e[1]));

  return (
    <div>
      <Titulo
        titulo="Membros"
        sub={`${count ?? 0} encontrados${(count ?? 0) > 200 ? ", mostrando os 200 mais recentes" : ""}.`}
        acao={<a href={`/api/admin/exportar?${exportar}`} className="btn btn-secundario">Exportar CSV</a>}
      />
      <Filtros
        campos={[
          { tipo: "busca", nome: "q", placeholder: "Nome, e-mail, cidade ou WhatsApp" },
          { tipo: "select", nome: "status", rotulo: "Todos os status", opcoes: [{ valor: "aprovado", rotulo: "Aprovados" }, { valor: "pendente", rotulo: "Pendentes" }, { valor: "bloqueado", rotulo: "Bloqueados" }] },
        ]}
      />
      <ul className="cartao divide-y divide-linha">
        {lista.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/membros/${m.id}`} className="font-semibold hover:text-azul">{m.nome}</Link>
                <Tag cor={COR[m.status]}>{m.status}</Tag>
                {m.is_admin && <Tag cor="azul">admin</Tag>}
                {m.status === "aprovado" && !m.perfil_completo && <Tag>perfil incompleto</Tag>}
              </div>
              <p className="mt-0.5 text-sm text-cinza-escuro">{m.email}{m.whatsapp && ` · ${formatarTelefone(m.whatsapp)}`}</p>
              <p className="text-xs text-cinza">
                {[local(m.cidade, m.uf), `entrou ${tempoRelativo(m.criado_em)}`, m.ultimo_acesso_em && `último acesso ${tempoRelativo(m.ultimo_acesso_em)}`].filter(Boolean).join(" · ")}
              </p>
            </div>
            {m.id !== eu.id && (
              <div className="flex flex-wrap gap-2">
                <form className="flex gap-2">
                  {m.status !== "aprovado" && <BotaoEnviar formAction={definirStatusDe.bind(null, "aprovado", m.id)} className="btn btn-azul btn-pequeno" pendente="...">Aprovar</BotaoEnviar>}
                  {m.status !== "bloqueado" && <BotaoEnviar formAction={definirStatusDe.bind(null, "bloqueado", m.id)} className="btn btn-secundario btn-pequeno" pendente="...">Bloquear</BotaoEnviar>}
                </form>
                <ConfirmarRemocao id={m.id} nome={m.nome} acao={removerMembro} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
