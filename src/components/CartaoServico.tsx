import Link from "next/link";
import { formatarFaixa, local } from "@/lib/formato";
import type { Autor, Servico } from "@/lib/types";
import { Avatar } from "./Avatar";
import { Tag } from "./Tag";

export type ServicoLista = Servico & { membro: Autor | null };

export function CartaoServico({ s, categoria }: { s: ServicoLista; categoria?: string }) {
  if (!s.membro) return null;
  const preco = formatarFaixa(s.preco_min, s.preco_max);
  return (
    <Link href={`/membros/${s.membro.id}?servico=${s.id}`} className="cartao group flex flex-col p-5 transition hover:border-azul/40">
      <div className="flex items-center gap-3">
        <Avatar nome={s.membro.nome} url={s.membro.foto_url} tamanho="md" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{s.membro.nome}</p>
          <p className="truncate text-sm text-cinza">{local(s.membro.cidade, s.membro.uf) ?? s.membro.titulo}</p>
        </div>
      </div>
      <h3 className="mt-4 font-bold leading-snug group-hover:text-azul">{s.nome}</h3>
      {s.descricao && <p className="mt-1 line-clamp-2 text-sm text-cinza">{s.descricao}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {categoria && <Tag cor="azul">{categoria}</Tag>}
        {preco && <span className="text-sm font-semibold text-cinza-escuro">{preco}</span>}
      </div>
    </Link>
  );
}
