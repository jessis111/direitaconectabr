import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Marca } from "@/components/Marca";
import { sessaoAtual } from "@/lib/auth";
import { GRUPO_WHATSAPP } from "@/lib/constantes";

export const metadata: Metadata = { title: "Aguardando aprovação" };

export default async function AguardandoPage() {
  const { user, membro } = await sessaoAtual();
  if (!user) redirect("/entrar");
  if (membro?.status === "aprovado") redirect("/inicio");
  const bloqueado = membro?.status === "bloqueado";

  return (
    <main className="bg-degrade min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5 py-6 sm:px-8">
        <Marca className="text-xl" href={null} />
        <div className="flex flex-1 flex-col justify-center py-16">
          <p className="text-sm font-medium text-white/75">Cadastro recebido</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {bloqueado ? "Seu acesso ainda não está liberado." : "Seu cadastro está em análise."}
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/85">
            {bloqueado
              ? "No momento não é possível entrar na plataforma."
              : `Olá${membro ? `, ${membro.nome.split(" ")[0]}` : ""}. A gente confere cada cadastro para manter a rede entre quem pensa igual. Assim que for aprovado, você recebe um e-mail e já pode entrar.`}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {!bloqueado && (
              <a href={GRUPO_WHATSAPP} target="_blank" rel="noreferrer" className="btn btn-primario">
                Entrar no grupo do WhatsApp
              </a>
            )}
            <form action="/sair" method="post">
              <button className="btn btn-claro">Sair</button>
            </form>
          </div>
        </div>
        <p className="text-sm text-white/60">@direitaconectabr</p>
      </div>
    </main>
  );
}
