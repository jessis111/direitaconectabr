import type { Metadata } from "next";
import Link from "next/link";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { Tag } from "@/components/Tag";
import { Titulo } from "@/components/Titulo";
import { Vazio } from "@/components/Vazio";
import { exigirMembro } from "@/lib/auth";
import { LIMITE_SERVICOS } from "@/lib/constantes";
import { categorias } from "@/lib/dados";
import { formatarFaixa } from "@/lib/formato";
import type { Servico } from "@/lib/types";
import { alternarServico } from "./actions";

export const metadata: Metadata = { title: "Meus serviços" };

export default async function MeusServicosPage() {
  const { supabase, membro } = await exigirMembro();
  const { porId } = await categorias();
  const { data } = await supabase.from("services").select("*").eq("membro_id", membro.id).order("criado_em");
  const servicos = (data ?? []) as Servico[];
  const podeCriar = servicos.length < LIMITE_SERVICOS;

  return (
    <div className="mx-auto max-w-2xl">
      <Titulo
        titulo="Meus serviços"
        sub={`${servicos.length} de ${LIMITE_SERVICOS}. Serviços ativos aparecem na vitrine.`}
        acao={podeCriar && <Link href="/perfil/servicos/novo" className="btn btn-primario">Novo serviço</Link>}
      />
      {!membro.perfil_completo && (
        <p className="mb-5 rounded-xl bg-amarelo/20 px-4 py-3 text-sm text-amarelo-tinta">
          Seus serviços só aparecem na busca depois que o perfil tiver título e categorias. <Link href="/perfil" className="font-semibold underline">Completar perfil</Link>
        </p>
      )}
      {servicos.length === 0 ? (
        <Vazio titulo="Nenhum serviço cadastrado" texto="Mostre o que você faz e receba pedidos de proposta." acao={{ href: "/perfil/servicos/novo", rotulo: "Cadastrar serviço" }} />
      ) : (
        <ul className="space-y-3">
          {servicos.map((s) => (
            <li key={s.id} className="cartao flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag cor="azul">{porId.get(s.categoria_id)?.nome ?? "Serviço"}</Tag>
                  {!s.ativo && <Tag cor="apagada">Pausado</Tag>}
                </div>
                <p className="mt-2 font-bold">{s.nome}</p>
                {formatarFaixa(s.preco_min, s.preco_max) && <p className="text-sm text-cinza">{formatarFaixa(s.preco_min, s.preco_max)}</p>}
              </div>
              <div className="flex gap-2">
                <form action={alternarServico}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="ativo" value={s.ativo ? "0" : "1"} />
                  <BotaoEnviar className="btn btn-secundario btn-pequeno" pendente="...">{s.ativo ? "Pausar" : "Ativar"}</BotaoEnviar>
                </form>
                <Link href={`/perfil/servicos/${s.id}`} className="btn btn-secundario btn-pequeno">Editar</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
