"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { soDigitos } from "@/lib/formato";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type EstadoLink = { erro?: string; enviadoPara?: string; volta?: string };

function mensagemErroAuth(msg: string) {
  if (/rate limit|security purposes/i.test(msg)) return "Muitas tentativas. Aguarde um minuto e tente de novo.";
  if (/signups not allowed|user not found/i.test(msg)) return "Não encontramos esse e-mail. Faça seu cadastro na página da rede.";
  return "Não foi possível enviar o link agora. Tente de novo em instantes.";
}

export async function entrar(_: EstadoLink, form: FormData): Promise<EstadoLink> {
  const email = z.string().trim().toLowerCase().email().safeParse(form.get("email"));
  if (!email.success) return { erro: "E-mail inválido" };
  const volta = String(form.get("volta") || "/inicio");
  const destino = volta.startsWith("/") && !volta.startsWith("//") ? volta : "/inicio";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { shouldCreateUser: false, emailRedirectTo: `${SITE}/auth/callback?next=${encodeURIComponent(destino)}` },
  });
  if (error) return { erro: mensagemErroAuth(error.message) };
  return { enviadoPara: email.data, volta: destino };
}

export async function confirmarCodigo(_: EstadoLink, form: FormData): Promise<EstadoLink> {
  const email = String(form.get("email") ?? "");
  const token = soDigitos(String(form.get("codigo") ?? ""));
  const volta = String(form.get("volta") || "/inicio");
  if (token.length < 6) return { erro: "Digite o código de 6 dígitos", enviadoPara: email, volta };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { erro: "Código inválido ou vencido. Peça um novo link.", enviadoPara: email, volta };
  redirect(volta.startsWith("/") && !volta.startsWith("//") ? volta : "/inicio");
}
