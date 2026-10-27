import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Denunciar } from "@/components/Denunciar";
import { Midia } from "@/components/Midia";
import { Tag } from "@/components/Tag";
import { exigirMembro } from "@/lib/auth";
import { ROTULO_PERFIL } from "@/lib/constantes";
import { categorias } from "@/lib/dados";
import { formatarFaixa, linkExterno, linkInstagram, linkTiktok, local } from "@/lib/formato";
import { COLUNAS_MEMBRO, type Membro, type Servico } from "@/lib/types";
import { PedirProposta } from "./PedirProposta";

export const metadata: Metadata = { title: "Perfil" };

export default async function MembroPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ servico?: string }>;
}) {
  const [{ id }, { servico: servicoSelecionado }] = await Promise.all([params, searchParams]);
  const { supabase, membro: eu } = await exigirMembro();
  const { porId, ugc } = await categorias();

  const [{ data: m }, { data: servs }] = await Promise.all([
    supabase.from("members").select(COLUNAS_MEMBRO).eq("id", id).maybeSingle(),
    supabase.from("services").select("*").eq("membro_id", id).eq("ativo", true).order("criado_em"),
  ]);
  if (!m) notFound();
  const membro = m as Membro;
  const servicos = (servs ?? []) as Servico[];
  const souEu = membro.id === eu.id;

  return (
    <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
      <aside className="space-y-4">
        <div className="cartao overflow-hidden">
          <div className="bg-degrade h-24" />
          <div className="-mt-12 px-6 pb-6">
            <Avatar nome={membro.nome} url={membro.foto_url} tamanho="xl" className="ring-4 ring-white" />
            <h1 className="mt-4 text-2xl font-bold tracking-tight">{membro.nome}</h1>
            {membro.titulo && <p className="mt-1 text-cinza-escuro">{membro.titulo}</p>}
            <p className="mt-1 text-sm text-cinza">{local(membro.cidade, membro.uf)}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {membro.perfis.map((p) => <Tag key={p} cor={p === "empresario" ? "neutra" : p === "prestador" ? "amarela" : "verde"}>{ROTULO_PERFIL[p]}</Tag>)}
            </div>
            {membro.bio && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-cinza-escuro">{membro.bio}</p>}
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-azul">
              {membro.instagram && <a href={linkInstagram(membro.instagram)!} target="_blank" rel="noreferrer">Instagram</a>}
              {membro.site && <a href={linkExterno(membro.site)!} target="_blank" rel="noreferrer">Site</a>}
            </div>
            {souEu && <Link href="/perfil" className="btn btn-secundario btn-pequeno mt-6">Editar perfil</Link>}
          </div>
        </div>
        {membro.categorias.length > 0 && (
          <div className="cartao p-5">
            <p className="rotulo">Atua em</p>
            <div className="flex flex-wrap gap-1.5">
              {membro.categorias.map((c) => porId.get(c) && <Tag key={c} cor="azul">{porId.get(c)!.nome}</Tag>)}
            </div>
          </div>
        )}
        {!souEu && <div className="px-1"><Denunciar alvoTipo="membro" alvoId={membro.id} /></div>}
      </aside>

      <section>
        <h2 className="text-xl font-bold tracking-tight">Serviços</h2>
        {servicos.length === 0 && <p className="mt-3 text-cinza">{souEu ? "Você ainda não cadastrou serviços." : "Este membro ainda não cadastrou serviços."}</p>}
        <div className="mt-4 space-y-4">
          {servicos.map((s) => {
            const preco = formatarFaixa(s.preco_min, s.preco_max);
            const ehUgc = s.categoria_id === ugc?.id;
            return (
              <article key={s.id} id={`s-${s.id}`} className={`cartao p-5 sm:p-6 ${servicoSelecionado === s.id ? "ring-2 ring-azul" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Tag cor={ehUgc ? "amarela" : "azul"}>{porId.get(s.categoria_id)?.nome ?? "Serviço"}</Tag>
                  {ehUgc && s.remoto != null && <Tag>{s.remoto ? "Remoto" : "Presencial"}</Tag>}
                </div>
                <h3 className="mt-3 text-lg font-bold">{s.nome}</h3>
                {s.descricao && <p className="mt-1 text-cinza-escuro">{s.descricao}</p>}
                {preco && <p className="mt-2 text-sm font-semibold">{preco}</p>}
                {ehUgc && (
                  <div className="mt-4 space-y-3 text-sm">
                    {s.nichos.length > 0 && <p><span className="text-cinza">Nichos: </span>{s.nichos.join(", ")}</p>}
                    {s.formatos.length > 0 && <p><span className="text-cinza">Formatos: </span>{s.formatos.join(", ")}</p>}
                    {s.tiktok && <a href={linkTiktok(s.tiktok)!} target="_blank" rel="noreferrer" className="font-semibold text-azul">TikTok</a>}
                    {s.portfolio.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {s.portfolio.map((p, i) => <Midia key={i} item={p} className="aspect-[4/5] w-full rounded-xl" />)}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {!souEu && servicos.length > 0 && (
          <div id="pedir" className="mt-8 scroll-mt-24">
            <PedirProposta servicos={servicos.map((s) => ({ id: s.id, nome: s.nome }))} inicial={servicoSelecionado} nome={membro.nome.split(" ")[0]} />
          </div>
        )}
      </section>
    </div>
  );
}
