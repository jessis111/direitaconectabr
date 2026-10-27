"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Home, MessageCircle, Sparkles, Store, User } from "lucide-react";
import { Avatar } from "./Avatar";
import { Marca } from "./Marca";

const ITENS = [
  { href: "/inicio", rotulo: "Início", icone: Home },
  { href: "/oportunidades", rotulo: "Oportunidades", icone: Briefcase },
  { href: "/servicos", rotulo: "Serviços", icone: Store },
  { href: "/creators", rotulo: "UGC creators", icone: Sparkles },
  { href: "/conversas", rotulo: "Conversas", icone: MessageCircle },
];

function ativo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navegacao({
  membro,
  naoLidas,
}: {
  membro: { id: string; nome: string; foto_url: string | null; is_admin: boolean };
  naoLidas: number;
}) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-linha bg-off/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Marca href="/inicio" className="text-lg text-azul" />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {ITENS.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={`relative rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  ativo(pathname, i.href) ? "bg-white text-tinta ring-1 ring-linha" : "text-cinza hover:text-tinta"
                }`}
              >
                {i.rotulo}
                {i.href === "/conversas" && naoLidas > 0 && (
                  <span className="ml-1.5 rounded-full bg-amarelo px-1.5 text-[11px] text-amarelo-tinta">{naoLidas}</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {membro.is_admin && (
              <Link
                href="/admin"
                className={`hidden rounded-full px-3 py-1.5 text-xs font-semibold ring-1 sm:inline-block ${
                  ativo(pathname, "/admin") ? "bg-tinta text-white ring-tinta" : "text-cinza-escuro ring-linha"
                }`}
              >
                Admin
              </Link>
            )}
            <Link href="/perfil" aria-label="Meu perfil" className="rounded-full ring-offset-2 hover:ring-2 hover:ring-linha">
              <Avatar nome={membro.nome} url={membro.foto_url} tamanho="sm" />
            </Link>
          </div>
        </div>
      </header>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-5">
          {[...ITENS.slice(0, 2), ITENS[2], ITENS[4], { href: "/perfil", rotulo: "Perfil", icone: User }].map((i) => {
            const Icone = i.icone;
            const on = ativo(pathname, i.href) || (i.href === "/servicos" && ativo(pathname, "/creators"));
            return (
              <Link
                key={i.href}
                href={i.href}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${on ? "text-azul" : "text-cinza"}`}
              >
                <Icone size={22} strokeWidth={on ? 2 : 1.5} />
                {i.rotulo === "UGC creators" ? "Creators" : i.rotulo}
                {i.href === "/conversas" && naoLidas > 0 && (
                  <span className="absolute right-[28%] top-1.5 size-2 rounded-full bg-amarelo ring-2 ring-white" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
