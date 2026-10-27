"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/admin", rotulo: "Painel" },
  { href: "/admin/fila", rotulo: "Fila de aprovação" },
  { href: "/admin/membros", rotulo: "Membros" },
  { href: "/admin/denuncias", rotulo: "Denúncias" },
  { href: "/admin/categorias", rotulo: "Categorias" },
];

export function AbasAdmin() {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 mb-8 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Admin">
      <div className="inline-flex gap-1 rounded-full bg-white p-1 ring-1 ring-linha">
        {ABAS.map((a) => {
          const on = a.href === "/admin" ? pathname === "/admin" : pathname.startsWith(a.href);
          return (
            <Link key={a.href} href={a.href} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${on ? "bg-tinta text-white" : "text-cinza hover:text-tinta"}`}>
              {a.rotulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
