import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Titulo } from "@/components/Titulo";
import { exigirMembro } from "@/lib/auth";
import { LIMITE_SERVICOS } from "@/lib/constantes";
import { categorias } from "@/lib/dados";
import { FormServico } from "../FormServico";

export const metadata: Metadata = { title: "Novo serviço" };

export default async function NovoServicoPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { supabase, membro } = await exigirMembro();
  const { count } = await supabase.from("services").select("id", { count: "exact", head: true }).eq("membro_id", membro.id);
  if ((count ?? 0) >= LIMITE_SERVICOS) redirect("/perfil/servicos");
  const { lista, ugc } = await categorias();
  const { categoria } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl">
      <Titulo titulo="Novo serviço" sub="Nome curto, o que está incluso e, se quiser, uma faixa de preço." />
      <FormServico membroId={membro.id} categorias={lista} ugc={ugc} categoriaInicial={categoria === "ugc" ? ugc?.id : undefined} />
    </div>
  );
}
