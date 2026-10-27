import type { Metadata } from "next";
import Link from "next/link";
import { AbasVitrine } from "@/components/AbasVitrine";
import { Avatar } from "@/components/Avatar";
import { Filtros } from "@/components/Filtros";
import { Midia } from "@/components/Midia";
import { Paginacao } from "@/components/Paginacao";
import { Tag } from "@/components/Tag";
import { Titulo } from "@/components/Titulo";
import { Vazio } from "@/components/Vazio";
import type { ServicoLista } from "@/components/CartaoServico";
import { exigirMembro } from "@/lib/auth";
import { FORMATOS_PADRAO, NICHOS_PADRAO, UFS } from "@/lib/constantes";
import { categorias } from "@/lib/dados";
import { formatarFaixa, local } from "@/lib/formato";
import { SELECT_SERVICO } from "@/lib/types";

export const metadata: Metadata = { title: "UGC creators" };

const POR_PAGINA = 24;
const FAIXAS_PRECO: Record<string, [number, number | null]> = {
  "500": [0, 500],
  "1500": [500, 1500],
  "mais": [1500, null],
};

type Busca = { nicho?: string; formato?: string; uf?: string; preco?: string; remoto?: string; pagina?: string };

export default async function CreatorsPage({ searchParams }: { searchParams: Promise<Busca> }) {
  const sp = await searchParams;
  const { supabase } = await exigirMembro();
  const { ugc } = await categorias();
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const nichos = ugc?.campos_extras?.nichos ?? NICHOS_PADRAO;
  const formatos = ugc?.campos_extras?.formatos ?? FORMATOS_PADRAO;

  // A aba é um recorte dos serviços na categoria UGC creator.
  let lista: ServicoLista[] = [];
  let total = 0;
  if (ugc) {
    let q = supabase.from("services").select(SELECT_SERVICO, { count: "exact" }).eq("ativo", true).eq("categoria_id", ugc.id).eq("membro.perfil_completo", true);
    if (sp.nicho) q = q.contains("nichos", [sp.nicho]);
    if (sp.formato) q = q.contains("formatos", [sp.formato]);
    if (sp.uf) q = q.eq("membro.uf", sp.uf);
    if (sp.remoto === "1") q = q.eq("remoto", true);
    const faixa = sp.preco ? FAIXAS_PRECO[sp.preco] : null;
    if (faixa) {
      // Creator cujo preço inicial cabe na faixa.
      q = q.gte("preco_min", faixa[0]);
      if (faixa[1] != null) q = q.lte("preco_min", faixa[1]);
    }
    const { data, count } = await q.order("criado_em", { ascending: false }).range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);
    lista = (data ?? []) as ServicoLista[];
    total = count ?? 0;
  }

  return (
    <div>
      <Titulo
        titulo="UGC creators"
        sub="Criadores de conteúdo da rede para ser a cara da sua marca."
        acao={<Link href="/oportunidades/nova?tipo=campanha_ugc" className="btn btn-primario">Publicar campanha UGC</Link>}
      />
      <AbasVitrine ativa="creators" />
      <Filtros
        campos={[
          { tipo: "select", nome: "nicho", rotulo: "Nicho", opcoes: nichos.map((n) => ({ valor: n, rotulo: n })) },
          { tipo: "select", nome: "formato", rotulo: "Formato", opcoes: formatos.map((f) => ({ valor: f, rotulo: f })) },
          { tipo: "select", nome: "uf", rotulo: "Estado", opcoes: UFS.map((u) => ({ valor: u, rotulo: u })) },
          { tipo: "select", nome: "preco", rotulo: "Preço", opcoes: [{ valor: "500", rotulo: "Até R$ 500" }, { valor: "1500", rotulo: "R$ 500 a 1.500" }, { valor: "mais", rotulo: "Acima de R$ 1.500" }] },
          { tipo: "check", nome: "remoto", rotulo: "Remoto" },
        ]}
      />
      {lista.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((s) => {
              if (!s.membro) return null;
              // Destaque: primeiro vídeo ou foto enviado; links ficam no perfil.
              const destaque = s.portfolio?.find((p) => p.tipo !== "link");
              return (
              <div key={s.id} className="cartao flex flex-col overflow-hidden">
                {destaque ? (
                  <Midia item={destaque} className="aspect-[4/5] w-full" />
                ) : (
                  <div className="bg-degrade flex aspect-[16/9] items-end p-5">
                    <p className="marca text-3xl">{s.membro.nome.split(" ")[0]}</p>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-3">
                    <Avatar nome={s.membro.nome} url={s.membro.foto_url} tamanho="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{s.membro.nome}</p>
                      <p className="truncate text-xs text-cinza">{s.remoto ? "Remoto" : local(s.membro.cidade, s.membro.uf)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.nichos.map((n) => <Tag key={n} cor="azul">{n}</Tag>)}
                  </div>
                  {formatarFaixa(s.preco_min, s.preco_max) && <p className="mt-3 text-sm font-semibold text-cinza-escuro">{formatarFaixa(s.preco_min, s.preco_max)}</p>}
                  <div className="mt-auto flex items-center gap-4 pt-5">
                    <Link href={`/membros/${s.membro.id}?servico=${s.id}#pedir`} className="btn btn-primario btn-pequeno">
                      Pedir proposta
                    </Link>
                    <Link href={`/membros/${s.membro.id}?servico=${s.id}`} className="text-sm font-semibold text-cinza hover:text-tinta">
                      Ver portfólio
                    </Link>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
          <Paginacao pagina={pagina} total={total} porPagina={POR_PAGINA} params={sp} />
        </>
      ) : (
        <Vazio
          titulo="Nenhum creator com esses filtros"
          texto="É creator? Cadastre um serviço na categoria UGC creator e apareça aqui."
          acao={{ href: "/perfil/servicos/novo?categoria=ugc", rotulo: "Cadastrar como creator" }}
        />
      )}
    </div>
  );
}
