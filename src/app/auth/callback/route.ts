import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function destinoSeguro(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/inicio";
}

// Link mágico no fluxo PKCE (mesmo navegador em que o link foi pedido).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = destinoSeguro(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/entrar?erro=link`);
}
