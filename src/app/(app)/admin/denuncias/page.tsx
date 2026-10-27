import type { Metadata } from "next";
import Link from "next/link";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { Tag } from "@/components/Tag";
import { Titulo } from "@/components/Titulo";
import { Vazio } from "@/components/Vazio";
import { exigirAdmin } from "@/lib/auth";
import { tempoRelativo } from "@/lib/formato";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolverDenuncia } from "../actions";

export const metadata: Metadata = { title: "Denúncias" };

type Denuncia = { id: string; alvo_tipo: "oportunidade" | "membro" | "servico"; alvo_id: string; motivo: string; criado_em: string; denunciante: { nome: string } | null };

const ROTULO = { oportunidade: "Oportunidade", membro: "Membro", servico: "Serviço" };

export default async function DenunciasPage() {
  await exigirAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("reports")
    .select("id, alvo_tipo, alvo_id, motivo, criado_em, denunciante:members!reports_denunciante_id_fkey(nome)")
    .eq("resolvido", false)
    .order("criado_em");
  const lista = (data ?? []) as unknown as Denuncia[];

  // Nome do alvo para facilitar a decisão.
  const nomes = new Map<string, { titulo: string; href: string }>();
  const porTipo = (t: Denuncia["alvo_tipo"]) => lista.filter((d) => d.alvo_tipo === t).map((d) => d.alvo_id);
  const [ops, membros, servs] = await Promise.all([
    porTipo("oportunidade").length ? admin.from("opportunities").select("id, titulo").in("id", porTipo("oportunidade")) : { data: [] },
    porTipo("membro").length ? admin.from("members").select("id, nome").in("id", porTipo("membro")) : { data: [] },
    porTipo("servico").length ? admin.from("services").select("id, nome, membro_id").in("id", porTipo("servico")) : { data: [] },
  ]);
  for (const o of (ops.data ?? []) as { id: string; titulo: string }[]) nomes.set(o.id, { titulo: o.titulo, href: `/oportunidades/${o.id}` });
  for (const m of (membros.data ?? []) as { id: string; nome: string }[]) nomes.set(m.id, { titulo: m.nome, href: `/membros/${m.id}` });
  for (const s of (servs.data ?? []) as { id: string; nome: string; membro_id: string }[]) nomes.set(s.id, { titulo: s.nome, href: `/membros/${s.membro_id}?servico=${s.id}` });

  return (
    <div>
      <Titulo titulo="Denúncias" sub="Remova o conteúdo ou ignore a denúncia." />
      {lista.length === 0 ? (
        <Vazio titulo="Nenhuma denúncia aberta" />
      ) : (
        <ul className="space-y-3">
          {lista.map((d) => {
            const alvo = nomes.get(d.alvo_id);
            return (
              <li key={d.id} className="cartao p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag cor="amarela">{ROTULO[d.alvo_tipo]}</Tag>
                  {alvo ? <Link href={alvo.href} className="font-semibold text-azul">{alvo.titulo}</Link> : <span className="text-cinza">Já removido</span>}
                </div>
                <p className="mt-3 whitespace-pre-line text-cinza-escuro">{d.motivo}</p>
                <p className="mt-2 text-xs text-cinza">Por {d.denunciante?.nome ?? "membro"} · {tempoRelativo(d.criado_em)}</p>
                <form className="mt-4 flex gap-2">
                  {alvo && (
                    <BotaoEnviar formAction={resolverDenuncia.bind(null, "remover", d.id)} className="btn btn-azul btn-pequeno" pendente="...">
                      {d.alvo_tipo === "membro" ? "Bloquear membro" : "Remover conteúdo"}
                    </BotaoEnviar>
                  )}
                  <BotaoEnviar formAction={resolverDenuncia.bind(null, "ignorar", d.id)} className="btn btn-secundario btn-pequeno" pendente="...">Ignorar</BotaoEnviar>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
