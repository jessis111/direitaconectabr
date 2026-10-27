import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CartaoOportunidade, type OportunidadeLista } from "@/components/CartaoOportunidade";
import { Vazio } from "@/components/Vazio";
import { exigirMembro } from "@/lib/auth";
import { categorias } from "@/lib/dados";
import { SELECT_OPORTUNIDADE } from "@/lib/types";

export const metadata: Metadata = { title: "Início" };

export default async function InicioPage() {
  const { supabase, membro } = await exigirMembro();
  if (!membro.onboarding_em) redirect("/onboarding");

  const [{ porId }, recentes, minhas, recebidas] = await Promise.all([
    categorias(),
    supabase.from("opportunities").select(SELECT_OPORTUNIDADE).neq("status", "fechada").order("criado_em", { ascending: false }).limit(6),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("autor_id", membro.id).neq("status", "fechada"),
    supabase.from("proposals").select("id", { count: "exact", head: true }).eq("para_id", membro.id).is("lida_em", null),
  ]);
  const lista = (recentes.data ?? []) as OportunidadeLista[];

  return (
    <div className="space-y-10">
      <section className="bg-degrade overflow-hidden rounded-[24px] px-6 py-8 sm:px-10 sm:py-12">
        <p className="text-sm font-medium text-white/75">Olá, {membro.nome.split(" ")[0]}</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">O que você quer resolver hoje?</h1>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/oportunidades/nova" className="btn btn-primario">Publicar o que eu preciso</Link>
          <Link href="/servicos" className="btn btn-claro">Encontrar quem faz</Link>
        </div>
      </section>

      {!membro.perfil_completo && (
        <Link href="/perfil" className="cartao flex items-center justify-between gap-4 p-5">
          <div>
            <p className="font-semibold">Complete seu perfil</p>
            <p className="text-sm text-cinza">Perfil sem título e categorias não aparece na busca.</p>
          </div>
          <span className="btn btn-secundario btn-pequeno">Completar</span>
        </Link>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/propostas", n: recebidas.count ?? 0, rotulo: "propostas novas" },
          { href: "/oportunidades?minhas=1", n: minhas.count ?? 0, rotulo: "oportunidades suas abertas" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="cartao p-5">
            <p className="marca text-4xl text-azul">{a.n}</p>
            <p className="mt-1 text-sm text-cinza">{a.rotulo}</p>
          </Link>
        ))}
        <Link href="/creators" className="cartao p-5">
          <p className="marca text-xl">UGC creators</p>
          <p className="mt-1 text-sm text-cinza">Rostos para a sua marca</p>
        </Link>
        <Link href="/perfil/servicos" className="cartao p-5">
          <p className="marca text-xl">Meus serviços</p>
          <p className="mt-1 text-sm text-cinza">Apareça na vitrine</p>
        </Link>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold tracking-tight">Oportunidades recentes</h2>
          <Link href="/oportunidades" className="text-sm font-semibold text-azul">Ver todas</Link>
        </div>
        {lista.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {lista.map((o) => <CartaoOportunidade key={o.id} o={o} categoria={porId.get(o.categoria_id)?.nome} />)}
          </div>
        ) : (
          <Vazio titulo="Nenhuma oportunidade ainda" texto="Seja o primeiro a publicar o que você precisa." acao={{ href: "/oportunidades/nova", rotulo: "Publicar oportunidade" }} />
        )}
      </section>
    </div>
  );
}
