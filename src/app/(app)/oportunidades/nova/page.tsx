import type { Metadata } from "next";
import { Titulo } from "@/components/Titulo";
import { exigirMembro } from "@/lib/auth";
import { categorias } from "@/lib/dados";
import { FormOportunidade } from "./FormOportunidade";

export const metadata: Metadata = { title: "Nova oportunidade" };

export default async function NovaOportunidadePage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { membro } = await exigirMembro();
  const { gerais } = await categorias();
  const { tipo } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl">
      <Titulo titulo="Publicar oportunidade" sub="Diga o que você precisa. Os membros que fazem isso mandam proposta." />
      <FormOportunidade categorias={gerais} cidade={membro.cidade} uf={membro.uf} tipoInicial={tipo === "campanha_ugc" ? "campanha_ugc" : "geral"} />
    </div>
  );
}
