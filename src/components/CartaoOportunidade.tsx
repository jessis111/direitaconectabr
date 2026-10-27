import Link from "next/link";
import { STATUS_OPORTUNIDADE } from "@/lib/constantes";
import { formatarFaixa, local, tempoRelativo } from "@/lib/formato";
import type { Autor, Oportunidade } from "@/lib/types";
import { Avatar } from "./Avatar";
import { Tag } from "./Tag";

export type OportunidadeLista = Oportunidade & { autor: Autor | null };

export function CartaoOportunidade({ o, categoria }: { o: OportunidadeLista; categoria?: string }) {
  const n = o.num_propostas;
  const orcamento = formatarFaixa(o.orcamento_min, o.orcamento_max);
  return (
    <Link href={`/oportunidades/${o.id}`} className="cartao group block p-5 transition hover:border-azul/40 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {o.tipo === "campanha_ugc" && <Tag cor="amarela">Campanha UGC</Tag>}
        {categoria && <Tag cor="azul">{categoria}</Tag>}
        {o.status !== "aberta" && <Tag cor={o.status === "fechada" ? "apagada" : "verde"}>{STATUS_OPORTUNIDADE[o.status]}</Tag>}
      </div>
      <h3 className="mt-3 text-lg font-bold leading-snug group-hover:text-azul">{o.titulo}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-cinza">{o.descricao}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-cinza-escuro">
        <span>{o.remoto ? "Remoto" : local(o.cidade, o.uf) ?? "Brasil"}</span>
        {orcamento && <span>{orcamento}</span>}
        <span>
          {n} {n === 1 ? "proposta" : "propostas"}
        </span>
      </div>
      {o.autor && (
        <div className="mt-4 flex items-center gap-2.5 border-t border-linha pt-4 text-sm">
          <Avatar nome={o.autor.nome} url={o.autor.foto_url} tamanho="sm" />
          <span className="font-semibold">{o.autor.nome}</span>
          <span className="ml-auto text-cinza">{tempoRelativo(o.criado_em)}</span>
        </div>
      )}
    </Link>
  );
}
