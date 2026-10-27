import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { Titulo } from "@/components/Titulo";
import { exigirMembro } from "@/lib/auth";
import { categorias } from "@/lib/dados";
import type { Servico } from "@/lib/types";
import { excluirServico } from "../actions";
import { FormServico } from "../FormServico";

export const metadata: Metadata = { title: "Editar serviço" };

export default async function EditarServicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, membro } = await exigirMembro();
  const { data } = await supabase.from("services").select("*").eq("id", id).eq("membro_id", membro.id).maybeSingle();
  if (!data) notFound();
  const { lista, ugc } = await categorias();
  return (
    <div className="mx-auto max-w-2xl">
      <Titulo titulo="Editar serviço" />
      <FormServico membroId={membro.id} categorias={lista} ugc={ugc} servico={data as Servico} />
      <form action={excluirServico} className="mt-6">
        <input type="hidden" name="id" value={id} />
        <BotaoEnviar className="text-sm font-semibold text-cinza hover:text-erro" pendente="Excluindo...">Excluir serviço</BotaoEnviar>
      </form>
    </div>
  );
}
