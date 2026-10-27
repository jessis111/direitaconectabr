import type { Metadata } from "next";
import Link from "next/link";
import { Titulo } from "@/components/Titulo";
import { exigirMembro } from "@/lib/auth";
import { categorias } from "@/lib/dados";
import { FormPerfil } from "./FormPerfil";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const { supabase, membro } = await exigirMembro();
  const [{ lista }, { data: privados }] = await Promise.all([categorias(), supabase.rpc("meus_dados").single()]);
  const dados = (privados ?? {}) as { email?: string; whatsapp?: string | null; telefone?: string | null };

  return (
    <div className="mx-auto max-w-2xl">
      <Titulo
        titulo="Meu perfil"
        sub={membro.perfil_completo ? "Seu perfil aparece na busca." : "Preencha título e categorias para aparecer na busca."}
        acao={<Link href={`/membros/${membro.id}`} className="btn btn-secundario btn-pequeno">Ver como os outros veem</Link>}
      />
      <nav className="mb-6 grid grid-cols-2 gap-3">
        <Link href="/perfil/servicos" className="cartao p-4 font-semibold">Meus serviços</Link>
        <Link href="/propostas" className="cartao p-4 font-semibold">Minhas propostas</Link>
      </nav>
      <FormPerfil membro={membro} categorias={lista} email={dados.email ?? ""} whatsapp={dados.whatsapp ?? ""} telefone={dados.telefone ?? ""} />
      <form action="/sair" method="post" className="mt-10 text-center">
        <button className="text-sm font-semibold text-cinza hover:text-tinta">Sair da conta</button>
      </form>
    </div>
  );
}
