import type { Metadata } from "next";
import Link from "next/link";
import { Titulo } from "@/components/Titulo";
import { exigirAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin" };

type Painel = Record<
  | "membros_aprovados" | "membros_pendentes" | "perfis_completos" | "ativos_30_dias" | "oportunidades_abertas"
  | "oportunidades_semana" | "propostas_semana" | "oportunidades_com_proposta" | "oportunidades_total"
  | "negocios_fechados" | "denuncias_abertas",
  number
>;

function pct(a: number, b: number) {
  return b ? `${Math.round((a / b) * 100)}%` : "0%";
}

export default async function AdminPage() {
  const { supabase } = await exigirAdmin();
  const { data } = await supabase.rpc("painel_admin");
  const p = (data ?? {}) as Painel;

  const metricas = [
    { rotulo: "Membros aprovados", valor: String(p.membros_aprovados ?? 0), meta: "Meta 90 dias: 300" },
    { rotulo: "Perfis completos", valor: pct(p.perfis_completos, p.membros_aprovados), meta: "Meta 90 dias: 60%" },
    { rotulo: "Oportunidades na semana", valor: String(p.oportunidades_semana ?? 0), meta: "Meta 90 dias: 10" },
    { rotulo: "Oportunidades com proposta", valor: pct(p.oportunidades_com_proposta, p.oportunidades_total), meta: "Meta 90 dias: 70%" },
    { rotulo: "Negócios fechados", valor: String(p.negocios_fechados ?? 0), meta: "Meta 90 dias: 15", destaque: true },
    { rotulo: "Ativos em 30 dias", valor: pct(p.ativos_30_dias, p.membros_aprovados), meta: "Meta 90 dias: 40%" },
    { rotulo: "Oportunidades abertas", valor: String(p.oportunidades_abertas ?? 0) },
    { rotulo: "Propostas na semana", valor: String(p.propostas_semana ?? 0) },
  ];

  return (
    <div>
      <Titulo titulo="Painel" sub="A métrica que importa é negócio fechado entre membros." />
      <div className="mb-8 flex flex-wrap gap-3">
        <Link href="/admin/fila" className="btn btn-primario">
          {p.membros_pendentes ?? 0} {p.membros_pendentes === 1 ? "cadastro pendente" : "cadastros pendentes"}
        </Link>
        {(p.denuncias_abertas ?? 0) > 0 && (
          <Link href="/admin/denuncias" className="btn btn-secundario">{p.denuncias_abertas} denúncias abertas</Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricas.map((m) => (
          <div key={m.rotulo} className={m.destaque ? "bg-degrade rounded-[18px] p-5" : "cartao p-5"}>
            <p className={`text-sm ${m.destaque ? "text-white/80" : "text-cinza"}`}>{m.rotulo}</p>
            <p className={`marca mt-2 text-4xl ${m.destaque ? "" : "text-azul"}`}>{m.valor}</p>
            {m.meta && <p className={`mt-2 text-xs ${m.destaque ? "text-white/70" : "text-cinza"}`}>{m.meta}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
