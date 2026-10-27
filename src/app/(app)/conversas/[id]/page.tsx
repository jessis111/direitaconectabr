import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { exigirMembro } from "@/lib/auth";
import { formatarValor, local } from "@/lib/formato";
import { COLUNAS_AUTOR, type Autor, type Conversa, type Mensagem, type Proposta } from "@/lib/types";
import { Chat } from "./Chat";

export const metadata: Metadata = { title: "Conversa" };

type Detalhe = Conversa & {
  a: Autor | null;
  b: Autor | null;
  proposta: (Proposta & { oportunidade: { id: string; titulo: string } | null; servico: { id: string; nome: string } | null }) | null;
};

export default async function ConversaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, membro } = await exigirMembro();

  const { data } = await supabase
    .from("conversations")
    .select(
      `*, a:members!conversations_membro_a_id_fkey(${COLUNAS_AUTOR}), b:members!conversations_membro_b_id_fkey(${COLUNAS_AUTOR}), proposta:proposals(*, oportunidade:opportunities(id, titulo), servico:services(id, nome))`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const c = data as Detalhe;
  const outro = c.membro_a_id === membro.id ? c.b : c.a;
  if (!outro) notFound();

  const [{ data: msgs }, { data: contato }] = await Promise.all([
    supabase.from("messages").select("*").eq("conversa_id", id).order("criado_em", { ascending: false }).limit(200),
    supabase.rpc("contato_membro", { alvo: outro.id }).maybeSingle(),
    supabase.rpc("marcar_lidas", { conversa: id }),
    c.proposta && c.proposta.para_id === membro.id && !c.proposta.lida_em
      ? supabase.from("proposals").update({ lida_em: new Date().toISOString() }).eq("id", c.proposta.id)
      : Promise.resolve(null),
  ]);
  const mensagens = ((msgs ?? []) as Mensagem[]).reverse();
  const tel = contato as { whatsapp: string | null; telefone: string | null } | null;
  const assunto = c.proposta?.oportunidade?.titulo ?? c.proposta?.servico?.nome ?? null;
  const linkAssunto = c.proposta?.oportunidade ? `/oportunidades/${c.proposta.oportunidade.id}` : `/membros/${c.proposta?.para_id}?servico=${c.proposta?.servico?.id}`;

  return (
    <div className="mx-auto flex h-[calc(100dvh-10.5rem)] max-w-3xl flex-col md:h-[calc(100dvh-7.5rem)]">
      <header className="cartao flex flex-wrap items-center gap-3 rounded-b-none p-4">
        <Link href="/conversas" className="text-sm font-semibold text-cinza md:hidden" aria-label="Voltar">‹</Link>
        <Link href={`/membros/${outro.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar nome={outro.nome} url={outro.foto_url} />
          <div className="min-w-0">
            <p className="truncate font-bold">{outro.nome}</p>
            <p className="truncate text-xs text-cinza">{outro.titulo ?? local(outro.cidade, outro.uf)}</p>
          </div>
        </Link>
      </header>

      {c.proposta && (
        <div className="border-x border-linha bg-white px-4 pb-3 text-sm">
          <div className="rounded-xl bg-off p-3">
            <p className="text-xs font-semibold text-cinza">{c.proposta.servico ? "Pedido de proposta" : "Proposta"} sobre</p>
            <Link href={linkAssunto} className="font-semibold text-azul">{assunto}</Link>
            <p className="mt-1 line-clamp-3 whitespace-pre-line text-cinza-escuro">{c.proposta.mensagem}</p>
            {(c.proposta.valor != null || c.proposta.prazo) && (
              <p className="mt-1 text-xs text-cinza">
                {c.proposta.valor != null && `Valor: ${formatarValor(c.proposta.valor)}`}
                {c.proposta.valor != null && c.proposta.prazo && " · "}
                {c.proposta.prazo && `Prazo: ${c.proposta.prazo}`}
              </p>
            )}
          </div>
        </div>
      )}

      <Chat
        conversaId={id}
        eu={membro.id}
        outroNome={outro.nome}
        iniciais={mensagens}
        whatsapp={tel?.whatsapp ?? null}
        telefone={tel?.telefone ?? tel?.whatsapp ?? null}
        mensagemWhatsApp={`Olá, ${outro.nome.split(" ")[0]}! Aqui é ${membro.nome.split(" ")[0]}, da Direita Conecta br${assunto ? `, sobre "${assunto}"` : ""}.`}
      />
    </div>
  );
}
