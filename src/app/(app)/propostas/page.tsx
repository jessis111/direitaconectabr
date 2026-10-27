import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Tag } from "@/components/Tag";
import { Titulo } from "@/components/Titulo";
import { Vazio } from "@/components/Vazio";
import { exigirMembro } from "@/lib/auth";
import { formatarValor, tempoRelativo } from "@/lib/formato";
import { COLUNAS_AUTOR, type Autor, type Proposta } from "@/lib/types";

export const metadata: Metadata = { title: "Minhas propostas" };

type Linha = Proposta & {
  de: Autor | null;
  para: Autor | null;
  oportunidade: { id: string; titulo: string; status: string } | null;
  servico: { id: string; nome: string } | null;
  conversa: { id: string }[];
};

const SELECT = `*, de:members!proposals_de_id_fkey(${COLUNAS_AUTOR}), para:members!proposals_para_id_fkey(${COLUNAS_AUTOR}), oportunidade:opportunities(id, titulo, status), servico:services(id, nome), conversa:conversations(id)`;

export default async function PropostasPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  const enviadas = aba === "enviadas";
  const { supabase, membro } = await exigirMembro();
  const { data } = await supabase
    .from("proposals")
    .select(SELECT)
    .eq(enviadas ? "de_id" : "para_id", membro.id)
    .order("criado_em", { ascending: false })
    .limit(100);
  const lista = (data ?? []) as Linha[];

  return (
    <div className="mx-auto max-w-3xl">
      <Titulo titulo="Propostas" sub="Propostas nas suas oportunidades e pedidos nos seus serviços." />
      <div className="mb-6 inline-flex rounded-full bg-white p-1 ring-1 ring-linha">
        {[
          { href: "/propostas", rotulo: "Recebidas", on: !enviadas },
          { href: "/propostas?aba=enviadas", rotulo: "Enviadas", on: enviadas },
        ].map((a) => (
          <Link key={a.href} href={a.href} className={`rounded-full px-4 py-2 text-sm font-semibold ${a.on ? "bg-azul text-white" : "text-cinza"}`}>{a.rotulo}</Link>
        ))}
      </div>
      {lista.length === 0 ? (
        <Vazio
          titulo={enviadas ? "Você ainda não mandou propostas" : "Nenhuma proposta recebida ainda"}
          texto={enviadas ? "Veja as oportunidades abertas e ofereça o que você faz." : "Publique uma oportunidade ou cadastre serviços para receber propostas."}
          acao={enviadas ? { href: "/oportunidades", rotulo: "Ver oportunidades" } : { href: "/oportunidades/nova", rotulo: "Publicar oportunidade" }}
        />
      ) : (
        <ul className="space-y-3">
          {lista.map((p) => {
            const outro = enviadas ? p.para : p.de;
            const conversa = p.conversa?.[0]?.id;
            const href = conversa ? `/conversas/${conversa}` : p.oportunidade ? `/oportunidades/${p.oportunidade.id}` : "/conversas";
            return (
              <li key={p.id}>
                <Link href={href} className="cartao flex gap-4 p-5 transition hover:border-azul/40">
                  {outro && <Avatar nome={outro.nome} url={outro.foto_url} />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{outro?.nome ?? "Membro"}</span>
                      <Tag cor={p.servico ? "amarela" : "azul"}>{p.servico ? "Pedido de serviço" : "Proposta"}</Tag>
                      {!enviadas && !p.lida_em && <Tag cor="verde">Nova</Tag>}
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-cinza-escuro">{p.oportunidade?.titulo ?? p.servico?.nome}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-cinza">{p.mensagem}</p>
                    <p className="mt-2 text-xs text-cinza">
                      {tempoRelativo(p.criado_em)}
                      {p.valor != null && ` · ${formatarValor(p.valor)}`}
                      {conversa ? " · Conversa aberta" : enviadas ? " · Aguardando resposta" : ""}
                    </p>
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
