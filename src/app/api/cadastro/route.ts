import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { GRUPO_WHATSAPP } from "@/lib/constantes";
import { soDigitos } from "@/lib/formato";

// Recebe o formulário da landing (Cloudflare Pages) e cria o membro pendente
// no Supabase, no lugar da planilha. Responde com o link do grupo.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const ORIGENS = (process.env.CADASTRO_ORIGENS ?? "").split(",").map((o) => o.trim()).filter(Boolean);

const PERFIL_TEXTO: Record<string, string> = {
  empresario: "empresario", "empresário": "empresario", empresarios: "empresario", "empresários": "empresario",
  prestador: "prestador", "prestador de serviço": "prestador", prestadores: "prestador",
  profissional: "profissional", profissionais: "profissional",
};

const schema = z.object({
  nome: z.string().trim().min(3).max(120),
  whatsapp: z.string().transform(soDigitos).refine((v) => v.length >= 10 && v.length <= 13),
  email: z.string().trim().toLowerCase().email(),
  cidade: z.string().trim().min(2).max(80),
  uf: z.string().trim().toUpperCase().length(2),
  perfis: z.array(z.enum(["empresario", "prestador", "profissional"])).min(1),
  aceite: z.literal(true),
});

function cors(origem: string | null) {
  const permitido = origem && ORIGENS.includes(origem) ? origem : "";
  return {
    "Access-Control-Allow-Origin": permitido,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get("origin")) });
}

export async function POST(request: NextRequest) {
  const headers = cors(request.headers.get("origin"));
  let corpo: Record<string, unknown>;
  try {
    corpo = request.headers.get("content-type")?.includes("application/json")
      ? await request.json()
      : Object.fromEntries(await request.formData());
  } catch {
    return NextResponse.json({ erro: "Formulário inválido" }, { status: 400, headers });
  }

  // Aceita perfil como lista ou texto ("Empresário, Prestador").
  const brutos = Array.isArray(corpo.perfis) ? corpo.perfis : String(corpo.perfis ?? corpo.perfil ?? "").split(/[,;]/);
  const perfis = [...new Set(brutos.map((p) => PERFIL_TEXTO[String(p).trim().toLowerCase()]).filter(Boolean))];
  const aceite = corpo.aceite === true || corpo.aceite === "true" || corpo.aceite === "on";

  const parsed = schema.safeParse({ ...corpo, whatsapp: String(corpo.whatsapp ?? ""), perfis, aceite });
  if (!parsed.success) {
    return NextResponse.json({ erro: "Confira os campos do formulário" }, { status: 422, headers });
  }
  const { email, aceite: _aceite, ...meta } = parsed.data;

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, flowType: "implicit" },
  });
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${SITE}/inicio`, data: { ...meta, aceite: _aceite } },
  });
  if (error && !/rate limit|security purposes/i.test(error.message)) {
    return NextResponse.json({ erro: "Não foi possível concluir o cadastro" }, { status: 500, headers });
  }
  return NextResponse.json({ ok: true, grupo: GRUPO_WHATSAPP }, { headers });
}
