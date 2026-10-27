import type { Metadata } from "next";
import { Marca } from "@/components/Marca";
import { exigirMembro } from "@/lib/auth";
import { categorias } from "@/lib/dados";
import { Passos } from "./Passos";

export const metadata: Metadata = { title: "Primeiros passos" };

export default async function OnboardingPage() {
  const { membro } = await exigirMembro();
  const { lista } = await categorias();

  return (
    <main className="bg-degrade min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-6 sm:px-8">
        <Marca className="text-xl" href={null} />
        <div className="flex flex-1 flex-col justify-center py-10">
          <Passos membro={membro} categorias={lista} />
        </div>
      </div>
    </main>
  );
}
