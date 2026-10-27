import type { Metadata } from "next";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { Titulo } from "@/components/Titulo";
import { Vazio } from "@/components/Vazio";
import { exigirAdmin } from "@/lib/auth";
import { ROTULO_PERFIL } from "@/lib/constantes";
import { formatarTelefone, linkWhatsApp, local, tempoRelativo } from "@/lib/formato";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Perfil } from "@/lib/types";
import { definirStatus, definirStatusDe } from "../actions";

export const metadata: Metadata = { title: "Fila de aprovação" };

type Pendente = { id: string; nome: string; email: string; whatsapp: string | null; cidade: string | null; uf: string | null; perfis: Perfil[]; criado_em: string };

export default async function FilaPage() {
  await exigirAdmin();
  const { data } = await createAdminClient()
    .from("members")
    .select("id, nome, email, whatsapp, cidade, uf, perfis, criado_em")
    .eq("status", "pendente")
    .order("criado_em");
  const lista = (data ?? []) as Pendente[];

  return (
    <div>
      <Titulo titulo="Fila de aprovação" sub={`${lista.length} ${lista.length === 1 ? "cadastro aguardando" : "cadastros aguardando"}. Marque vários para aprovar em lote.`} />
      {lista.length === 0 ? (
        <Vazio titulo="Fila zerada" texto="Nenhum cadastro aguardando aprovação." />
      ) : (
        <form className="space-y-4">
          <div className="sticky top-16 z-10 -mx-1 flex flex-wrap gap-2 bg-off/95 px-1 py-2 backdrop-blur">
            <BotaoEnviar formAction={definirStatus.bind(null, "aprovado")} className="btn btn-primario btn-pequeno" pendente="Aprovando...">Aprovar selecionados</BotaoEnviar>
            <BotaoEnviar formAction={definirStatus.bind(null, "bloqueado")} className="btn btn-secundario btn-pequeno" pendente="Bloqueando...">Bloquear selecionados</BotaoEnviar>
          </div>
          <ul className="cartao divide-y divide-linha">
            {lista.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                <input type="checkbox" name="id" value={m.id} aria-label={`Selecionar ${m.nome}`} className="size-5 accent-azul" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{m.nome}</p>
                  <p className="text-sm text-cinza">
                    {[local(m.cidade, m.uf), m.perfis.map((p) => ROTULO_PERFIL[p]).join(", "), tempoRelativo(m.criado_em)].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-sm text-cinza-escuro">
                    {m.email}
                    {m.whatsapp && (
                      <>
                        {" · "}
                        <a href={linkWhatsApp(m.whatsapp)} target="_blank" rel="noreferrer" className="font-semibold text-azul">{formatarTelefone(m.whatsapp)}</a>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <BotaoEnviar formAction={definirStatusDe.bind(null, "aprovado", m.id)} className="btn btn-azul btn-pequeno" pendente="...">Aprovar</BotaoEnviar>
                  <BotaoEnviar formAction={definirStatusDe.bind(null, "bloqueado", m.id)} className="btn btn-secundario btn-pequeno" pendente="...">Bloquear</BotaoEnviar>
                </div>
              </li>
            ))}
          </ul>
        </form>
      )}
    </div>
  );
}
