import type { Metadata } from "next";
import Link from "next/link";
import { CartaoOportunidade, type OportunidadeLista } from "@/components/CartaoOportunidade";
import { Filtros } from "@/components/Filtros";
import { Paginacao } from "@/components/Paginacao";
import { Titulo } from "@/components/Titulo";
import { Vazio } from "@/components/Vazio";
import { exigirMembro } from "@/lib/auth";
import { UFS } from "@/lib/constantes";
import { categorias } from "@/lib/dados";
import { SELECT_OPORTUNIDADE } from "@/lib/types";

export const metadata: Metadata = { title: "Oportunidades" };

const POR_PAGINA = 20;
const PERIODOS: Record<string, number> = { "7": 7, "30": 30 };

type Busca = { q?: string; categoria?: string; uf?: string; remoto?: string; periodo?: string; tipo?: string; minhas?: string; fechadas?: string; pagina?: string };

export default async function OportunidadesPage({ searchParams }: { searchParams: Promise<Busca> }) {
  const sp = await searchParams;
  const { supabase, membro } = await exigirMembro();
  const { lista: cats, porId } = await categorias();
  const pagina = Math.max(1, Number(sp.pagina) || 1);

  let q = supabase.from("opportunities").select(SELECT_OPORTUNIDADE, { count: "exact" });
  if (sp.fechadas !== "1") q = q.neq("status", "fechada");
  if (sp.categoria) q = q.eq("categoria_id", sp.categoria);
  if (sp.uf) q = q.eq("uf", sp.uf);
  if (sp.remoto === "1") q = q.eq("remoto", true);
  if (sp.tipo === "1") q = q.eq("tipo", "campanha_ugc");
  if (sp.minhas === "1") q = q.eq("autor_id", membro.id);
  if (sp.periodo && PERIODOS[sp.periodo]) {
    q = q.gte("criado_em", new Date(Date.now() - PERIODOS[sp.periodo] * 86400000).toISOString());
  }
  if (sp.q) {
    const termo = sp.q.replace(/[%,()]/g, " ").trim();
    if (termo) q = q.or(`titulo.ilike.%${termo}%,descricao.ilike.%${termo}%`);
  }
  const { data, count } = await q
    .order("criado_em", { ascending: false })
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);
  const lista = (data ?? []) as OportunidadeLista[];

  return (
    <div>
      <Titulo
        titulo="Oportunidades"
        sub="O que os membros estão precisando agora."
        acao={<Link href="/oportunidades/nova" className="btn btn-primario">Publicar oportunidade</Link>}
      />
      <Filtros
        campos={[
          { tipo: "busca", nome: "q", placeholder: "Buscar por palavra" },
          { tipo: "select", nome: "categoria", rotulo: "Categoria", opcoes: cats.map((c) => ({ valor: c.id, rotulo: c.nome })) },
          { tipo: "select", nome: "uf", rotulo: "Estado", opcoes: UFS.map((u) => ({ valor: u, rotulo: u })) },
          { tipo: "select", nome: "periodo", rotulo: "Qualquer data", opcoes: [{ valor: "7", rotulo: "Últimos 7 dias" }, { valor: "30", rotulo: "Últimos 30 dias" }] },
          { tipo: "check", nome: "remoto", rotulo: "Remoto" },
          { tipo: "check", nome: "tipo", rotulo: "Campanhas UGC" },
          { tipo: "check", nome: "minhas", rotulo: "Minhas" },
          { tipo: "check", nome: "fechadas", rotulo: "Incluir fechadas" },
        ]}
      />
      {lista.length ? (
        <>
          <p className="mb-3 text-sm text-cinza">{count} {count === 1 ? "oportunidade" : "oportunidades"}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {lista.map((o) => <CartaoOportunidade key={o.id} o={o} categoria={porId.get(o.categoria_id)?.nome} />)}
          </div>
          <Paginacao pagina={pagina} total={count ?? 0} porPagina={POR_PAGINA} params={sp} />
        </>
      ) : (
        <Vazio titulo="Nada por aqui com esses filtros" texto="Tente outra categoria ou estado, ou publique o que você precisa." acao={{ href: "/oportunidades/nova", rotulo: "Publicar oportunidade" }} />
      )}
    </div>
  );
}
