import type { Metadata } from "next";
import Link from "next/link";
import { AbasVitrine } from "@/components/AbasVitrine";
import { CartaoServico, type ServicoLista } from "@/components/CartaoServico";
import { Filtros } from "@/components/Filtros";
import { Paginacao } from "@/components/Paginacao";
import { Titulo } from "@/components/Titulo";
import { Vazio } from "@/components/Vazio";
import { exigirMembro } from "@/lib/auth";
import { UFS } from "@/lib/constantes";
import { categorias } from "@/lib/dados";
import { SELECT_SERVICO } from "@/lib/types";

export const metadata: Metadata = { title: "Serviços" };

const POR_PAGINA = 24;

type Busca = { q?: string; categoria?: string; uf?: string; cidade?: string; pagina?: string };

export default async function ServicosPage({ searchParams }: { searchParams: Promise<Busca> }) {
  const sp = await searchParams;
  const { supabase } = await exigirMembro();
  const { lista: cats, porId } = await categorias();
  const pagina = Math.max(1, Number(sp.pagina) || 1);

  // Perfil incompleto não aparece na busca.
  let q = supabase.from("services").select(SELECT_SERVICO, { count: "exact" }).eq("ativo", true).eq("membro.perfil_completo", true);
  if (sp.categoria) q = q.eq("categoria_id", sp.categoria);
  if (sp.uf) q = q.eq("membro.uf", sp.uf);
  if (sp.cidade) q = q.ilike("membro.cidade", `%${sp.cidade.replace(/[%,()]/g, "")}%`);
  if (sp.q) {
    const termo = sp.q.replace(/[%,()]/g, " ").trim();
    if (termo) q = q.or(`nome.ilike.%${termo}%,descricao.ilike.%${termo}%`);
  }
  const { data, count } = await q.order("criado_em", { ascending: false }).range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);
  const lista = (data ?? []) as ServicoLista[];

  return (
    <div>
      <Titulo titulo="Serviços" sub="Quem da rede faz o que você precisa." acao={<Link href="/perfil/servicos" className="btn btn-secundario">Meus serviços</Link>} />
      <AbasVitrine ativa="servicos" />
      <Filtros
        campos={[
          { tipo: "busca", nome: "q", placeholder: "Buscar serviço" },
          { tipo: "select", nome: "categoria", rotulo: "Categoria", opcoes: cats.map((c) => ({ valor: c.id, rotulo: c.nome })) },
          { tipo: "select", nome: "uf", rotulo: "Estado", opcoes: UFS.map((u) => ({ valor: u, rotulo: u })) },
          { tipo: "busca", nome: "cidade", placeholder: "Cidade" },
        ]}
      />
      {lista.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((s) => <CartaoServico key={s.id} s={s} categoria={porId.get(s.categoria_id)?.nome} />)}
          </div>
          <Paginacao pagina={pagina} total={count ?? 0} porPagina={POR_PAGINA} params={sp} />
        </>
      ) : (
        <Vazio titulo="Nenhum serviço encontrado" texto="Publique uma oportunidade e deixe quem faz vir até você." acao={{ href: "/oportunidades/nova", rotulo: "Publicar oportunidade" }} />
      )}
    </div>
  );
}
