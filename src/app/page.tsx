import { redirect } from "next/navigation";
import { sessaoAtual } from "@/lib/auth";

// A landing é a do Cloudflare Pages; o sistema começa no login.
export default async function Raiz() {
  const { user, membro } = await sessaoAtual();
  if (!user) redirect("/entrar");
  redirect(membro?.status === "aprovado" ? "/inicio" : "/aguardando");
}
