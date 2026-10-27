import type { Metadata } from "next";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { Tag } from "@/components/Tag";
import { Titulo } from "@/components/Titulo";
import { exigirAdmin } from "@/lib/auth";
import { SLUG_UGC } from "@/lib/constantes";
import type { Categoria } from "@/lib/types";
import { alternarCategoria, salvarCategoria } from "../actions";

export const metadata: Metadata = { title: "Categorias" };

export default async function CategoriasPage() {
  const { supabase } = await exigirAdmin();
  const { data } = await supabase.from("categories").select("*").order("ordem");
  const lista = (data ?? []) as Categoria[];

  return (
    <div className="max-w-3xl">
      <Titulo titulo="Categorias" sub="Usadas em perfis, oportunidades e serviços. Desativar esconde dos formulários sem apagar o que já existe." />
      <ul className="cartao divide-y divide-linha">
        {lista.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 p-4">
            <form action={salvarCategoria} className="flex flex-1 flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input name="ordem" type="number" defaultValue={c.ordem} aria-label="Ordem" className="campo w-20 py-2" />
              <input name="nome" defaultValue={c.nome} aria-label="Nome" className="campo min-w-40 flex-1 py-2" />
              <BotaoEnviar className="btn btn-secundario btn-pequeno" pendente="...">Salvar</BotaoEnviar>
            </form>
            <div className="flex items-center gap-2">
              {c.slug === SLUG_UGC && <Tag cor="amarela">aba creators</Tag>}
              {!c.ativa && <Tag cor="apagada">inativa</Tag>}
              {c.slug !== SLUG_UGC && (
                <form action={alternarCategoria}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="ativa" value={c.ativa ? "0" : "1"} />
                  <BotaoEnviar className="btn btn-pequeno text-cinza hover:text-tinta" pendente="...">{c.ativa ? "Desativar" : "Ativar"}</BotaoEnviar>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
      <form action={salvarCategoria} className="cartao mt-6 flex flex-wrap items-end gap-2 p-4">
        <div className="w-20">
          <label htmlFor="ordem-nova" className="rotulo">Ordem</label>
          <input id="ordem-nova" name="ordem" type="number" defaultValue={(lista.at(-1)?.ordem ?? 0) + 10} className="campo py-2" />
        </div>
        <div className="min-w-40 flex-1">
          <label htmlFor="nome-nova" className="rotulo">Nova categoria</label>
          <input id="nome-nova" name="nome" required minLength={2} className="campo py-2" />
        </div>
        <BotaoEnviar className="btn btn-primario btn-pequeno" pendente="...">Adicionar</BotaoEnviar>
      </form>
    </div>
  );
}
