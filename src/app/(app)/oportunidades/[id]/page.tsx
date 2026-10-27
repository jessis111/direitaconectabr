import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { Denunciar } from "@/components/Denunciar";
import { Tag } from "@/components/Tag";
import { exigirMembro } from "@/lib/auth";
import { LIMITE_PROPOSTAS, STATUS_OPORTUNIDADE } from "@/lib/constantes";
import { categorias } from "@/lib/dados";
import { formatarData, formatarFaixa, formatarValor, local, tempoRelativo } from "@/lib/formato";
import { COLUNAS_AUTOR, SELECT_OPORTUNIDADE, type Autor, type Oportunidade, type Proposta } from "@/lib/types";
import { abrirConversa, excluirOportunidade, mudarStatus } from "../actions";
import { FormProposta } from "./FormProposta";
import { FecharOportunidade } from "./FecharOportunidade";

export const metadata: Metadata = { title: "Oportunidade" };

type PropostaComAutor = Proposta & { de: Autor | null; conversa: { id: string }[] };

export default async function OportunidadePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, membro } = await exigirMembro();
  const { porId } = await categorias();

  const { data } = await supabase.from("opportunities").select(SELECT_OPORTUNIDADE).eq("id", id).maybeSingle();
  if (!data) notFound();
  const o = data as Oportunidade & { autor: Autor };
  const souAutor = o.autor_id === membro.id;

  const { data: props } = await supabase
    .from("proposals")
    .select(`*, de:members!proposals_de_id_fkey(${COLUNAS_AUTOR}), conversa:conversations(id)`)
    .eq("oportunidade_id", id)
    .order("criado_em", { ascending: true });
  const propostas = (props ?? []) as PropostaComAutor[];
  const minha = propostas.find((p) => p.de_id === membro.id);

  if (souAutor && propostas.some((p) => !p.lida_em)) {
    await supabase.from("proposals").update({ lida_em: new Date().toISOString() }).eq("oportunidade_id", id).is("lida_em", null);
  }

  const orcamento = formatarFaixa(o.orcamento_min, o.orcamento_max);
  const fechada = o.status === "fechada";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <article>
        <Link href="/oportunidades" className="text-sm font-semibold text-cinza hover:text-tinta">Oportunidades</Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {o.tipo === "campanha_ugc" && <Tag cor="amarela">Campanha UGC</Tag>}
          <Tag cor="azul">{porId.get(o.categoria_id)?.nome ?? "Outros"}</Tag>
          <Tag cor={fechada ? "apagada" : o.status === "em_conversa" ? "verde" : "neutra"}>{STATUS_OPORTUNIDADE[o.status]}</Tag>
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight">{o.titulo}</h1>
        <p className="mt-2 text-sm text-cinza">Publicada {tempoRelativo(o.criado_em)}</p>

        <dl className="mt-6 grid grid-cols-2 gap-4 rounded-[18px] bg-white p-5 ring-1 ring-linha sm:grid-cols-4">
          <Info rotulo="Local" valor={o.remoto ? "Remoto" : local(o.cidade, o.uf) ?? "Brasil"} />
          <Info rotulo="Orçamento" valor={orcamento ?? "A combinar"} />
          <Info rotulo="Prazo" valor={o.prazo ? formatarData(o.prazo + "T12:00:00") : "A combinar"} />
          {o.tipo === "campanha_ugc" ? <Info rotulo="Entregas" valor={o.entregas ? String(o.entregas) : "A combinar"} /> : <Info rotulo="Propostas" valor={String(o.num_propostas)} />}
        </dl>

        <div className="mt-8 whitespace-pre-line text-[1.0625rem] leading-relaxed text-cinza-escuro">{o.descricao}</div>

        {souAutor ? (
          <section className="mt-12">
            <h2 className="text-xl font-bold tracking-tight">Propostas recebidas ({propostas.length})</h2>
            {propostas.length === 0 && <p className="mt-3 text-cinza">Ainda nenhuma proposta. Os membros são avisados pela lista de oportunidades.</p>}
            <ul className="mt-5 space-y-4">
              {propostas.map((p) => (
                <li key={p.id} className="cartao p-5">
                  {p.de && (
                    <Link href={`/membros/${p.de.id}`} className="flex items-center gap-3">
                      <Avatar nome={p.de.nome} url={p.de.foto_url} />
                      <div>
                        <p className="font-semibold">{p.de.nome}</p>
                        <p className="text-sm text-cinza">{p.de.titulo ?? local(p.de.cidade, p.de.uf)}</p>
                      </div>
                      {!p.lida_em && <Tag cor="amarela">Nova</Tag>}
                    </Link>
                  )}
                  <p className="mt-4 whitespace-pre-line text-cinza-escuro">{p.mensagem}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-cinza">
                    {p.valor != null && <span>Valor: <strong className="text-tinta">{formatarValor(p.valor)}</strong></span>}
                    {p.prazo && <span>Prazo: <strong className="text-tinta">{p.prazo}</strong></span>}
                    <span>{tempoRelativo(p.criado_em)}</span>
                  </div>
                  <div className="mt-4">
                    {p.conversa?.[0] ? (
                      <Link href={`/conversas/${p.conversa[0].id}`} className="btn btn-secundario btn-pequeno">Ver conversa</Link>
                    ) : (
                      <form action={abrirConversa}>
                        <input type="hidden" name="proposta_id" value={p.id} />
                        <BotaoEnviar className="btn btn-primario btn-pequeno" pendente="Abrindo...">Abrir conversa</BotaoEnviar>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : minha ? (
          <section className="mt-12 rounded-[18px] bg-verde/8 p-5">
            <p className="font-semibold text-verde">Você mandou proposta {tempoRelativo(minha.criado_em)}.</p>
            <p className="mt-2 whitespace-pre-line text-sm text-cinza-escuro">{minha.mensagem}</p>
            {minha.conversa?.[0] ? (
              <Link href={`/conversas/${minha.conversa[0].id}`} className="btn btn-primario btn-pequeno mt-4">Abrir conversa</Link>
            ) : (
              <p className="mt-3 text-sm text-cinza">Quando {o.autor.nome.split(" ")[0]} abrir a conversa, ela aparece em Conversas.</p>
            )}
          </section>
        ) : fechada ? (
          <p className="mt-12 rounded-[18px] bg-apagado/40 p-5 text-cinza-escuro">Esta oportunidade foi fechada e não recebe mais propostas.</p>
        ) : o.num_propostas >= LIMITE_PROPOSTAS ? (
          <p className="mt-12 rounded-[18px] bg-apagado/40 p-5 text-cinza-escuro">Esta oportunidade já recebeu o máximo de {LIMITE_PROPOSTAS} propostas.</p>
        ) : (
          <FormProposta oportunidadeId={o.id} />
        )}
      </article>

      <aside className="space-y-4 lg:pt-10">
        <Link href={`/membros/${o.autor.id}`} className="cartao flex items-center gap-3 p-5">
          <Avatar nome={o.autor.nome} url={o.autor.foto_url} tamanho="lg" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-cinza">Publicado por</p>
            <p className="truncate font-bold">{o.autor.nome}</p>
            <p className="truncate text-sm text-cinza">{o.autor.titulo ?? local(o.autor.cidade, o.autor.uf)}</p>
          </div>
        </Link>

        {souAutor && (
          <div className="cartao space-y-3 p-5">
            <p className="font-semibold">Gerenciar</p>
            {fechada ? (
              <form action={mudarStatus}>
                <input type="hidden" name="id" value={o.id} />
                <input type="hidden" name="status" value="aberta" />
                <BotaoEnviar className="btn btn-secundario btn-pequeno w-full">Reabrir oportunidade</BotaoEnviar>
              </form>
            ) : (
              <FecharOportunidade id={o.id} candidatos={propostas.flatMap((p) => (p.de ? [{ id: p.de.id, nome: p.de.nome }] : []))} />
            )}
            <form action={excluirOportunidade}>
              <input type="hidden" name="id" value={o.id} />
              <BotaoEnviar className="w-full py-2 text-sm font-semibold text-cinza hover:text-erro" pendente="Excluindo...">Excluir</BotaoEnviar>
            </form>
          </div>
        )}

        <p className="px-1 text-xs leading-relaxed text-cinza">
          A plataforma conecta os membros e não intermedeia pagamentos. Combine valores e prazos por escrito.
        </p>
        {!souAutor && <div className="px-1"><Denunciar alvoTipo="oportunidade" alvoId={o.id} /></div>}
      </aside>
    </div>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-cinza">{rotulo}</dt>
      <dd className="mt-0.5 font-semibold">{valor}</dd>
    </div>
  );
}
