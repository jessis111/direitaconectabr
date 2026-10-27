"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { soDigitos } from "@/lib/formato";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type EstadoLink = { erro?: string; enviadoPara?: string; volta?: string };

const cadastroSchema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome completo").max(120),
  whatsapp: z
    .string()
    .transform(soDigitos)
    .refine((v) => v.length >= 10 && v.length <= 13, "WhatsApp com DDD, só números"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  cidade: z.string().trim().min(2, "Informe sua cidade").max(80),
  uf: z.string().length(2, "Escolha o estado"),
  perfis: z.array(z.enum(["empresario", "prestador", "profissional"])).min(1, "Escolha ao menos um perfil"),
  principios: z.literal("on", { message: "É preciso aceitar os princípios da rede" }),
  lgpd: z.literal("on", { message: "É preciso autorizar o uso dos dados" }),
});

function mensagemErroAuth(msg: string) {
  if (/rate limit|security purposes/i.test(msg)) return "Muitas tentativas. Aguarde um minuto e tente de novo.";
  if (/signups not allowed|user not found/i.test(msg)) return "Não encontramos esse e-mail. Faça seu cadastro primeiro.";
  return "Não foi possível enviar o link agora. Tente de novo em instantes.";
}

export async function cadastrar(_: EstadoLink, form: FormData): Promise<EstadoLink> {
  const parsed = cadastroSchema.safeParse({
    nome: form.get("nome"),
    whatsapp: String(form.get("whatsapp") ?? ""),
    email: form.get("email"),
    cidade: form.get("cidade"),
    uf: form.get("uf"),
    perfis: form.getAll("perfis"),
    principios: form.get("principios"),
    lgpd: form.get("lgpd"),
  });
  if (!parsed.success) return { erro: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: d.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${SITE}/auth/callback?next=/onboarding`,
      data: { nome: d.nome, whatsapp: d.whatsapp, cidade: d.cidade, uf: d.uf, perfis: d.perfis, aceite: true },
    },
  });
  if (error) return { erro: mensagemErroAuth(error.message) };
  return { enviadoPara: d.email, volta: "/onboarding" };
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
