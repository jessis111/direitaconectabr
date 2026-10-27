import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Titulo } from "@/components/Titulo";
import { Vazio } from "@/components/Vazio";
import { exigirMembro } from "@/lib/auth";
import { tempoRelativo } from "@/lib/formato";
import { COLUNAS_AUTOR, type Autor, type Conversa } from "@/lib/types";

export const metadata: Metadata = { title: "Conversas" };

type Linha = Conversa & {
  a: Autor | null;
  b: Autor | null;
  proposta: { oportunidade: { titulo: string } | null; servico: { nome: string } | null } | null;
};

export default async function ConversasPage() {
  const { supabase, membro } = await exigirMembro();
  const [{ data }, { data: naoLidas }] = await Promise.all([
    supabase
      .from("conversations")
      .select(
        `*, a:members!conversations_membro_a_id_fkey(${COLUNAS_AUTOR}), b:members!conversations_membro_b_id_fkey(${COLUNAS_AUTOR}), proposta:proposals(oportunidade:opportunities(titulo), servico:services(nome))`,
      )
      .order("ultima_msg_em", { ascending: false, nullsFirst: false })
      .order("criado_em", { ascending: false }),
    supabase.from("messages").select("conversa_id").neq("de_id", membro.id).is("lida_em", null),
  ]);
  const lista = (data ?? []) as Linha[];
  const pendentes = new Map<string, number>();
  for (const m of naoLidas ?? []) pendentes.set(m.conversa_id, (pendentes.get(m.conversa_id) ?? 0) + 1);

  return (
    <div className="mx-auto max-w-3xl">
      <Titulo titulo="Conversas" sub="Combine os detalhes aqui. Quando decidir, ligue ou chame no WhatsApp." />
      {lista.length === 0 ? (
        <Vazio titulo="Nenhuma conversa ainda" texto="Conversas abrem quando você pede proposta num serviço ou quando alguém aceita conversar sobre a sua proposta." acao={{ href: "/servicos", rotulo: "Ver serviços" }} />
      ) : (
        <ul className="cartao divide-y divide-linha overflow-hidden">
          {lista.map((c) => {
            const outro = c.membro_a_id === membro.id ? c.b : c.a;
            const assunto = c.proposta?.oportunidade?.titulo ?? c.proposta?.servico?.nome;
            const n = pendentes.get(c.id) ?? 0;
            return (
              <li key={c.id}>
                <Link href={`/conversas/${c.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-off">
                  <Avatar nome={outro?.nome ?? "?"} url={outro?.foto_url ?? null} />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate ${n ? "font-bold" : "font-semibold"}`}>{outro?.nome ?? "Membro"}</p>
                    {assunto && <p className="truncate text-sm text-cinza">{assunto}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-cinza">{tempoRelativo(c.ultima_msg_em ?? c.criado_em)}</span>
                    {n > 0 && <span className="rounded-full bg-amarelo px-2 text-xs font-bold text-amarelo-tinta">{n}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
