"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export type CampoFiltro =
  | { tipo: "busca"; nome: string; placeholder: string }
  | { tipo: "select"; nome: string; rotulo: string; opcoes: { valor: string; rotulo: string }[] }
  | { tipo: "check"; nome: string; rotulo: string };

// Filtros na URL (?categoria=...&uf=...), para links compartilháveis.
export function Filtros({ campos }: { campos: CampoFiltro[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pendente, iniciar] = useTransition();

  function definir(nome: string, valor: string) {
    const p = new URLSearchParams(params.toString());
    if (valor) p.set(nome, valor);
    else p.delete(nome);
    p.delete("pagina");
    iniciar(() => router.replace(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false }));
  }

  const algum = campos.some((c) => params.get(c.nome));

  return (
    <div className={`mb-6 flex flex-wrap items-center gap-2 transition-opacity ${pendente ? "opacity-60" : ""}`}>
      {campos.map((c) => {
        if (c.tipo === "busca")
          return (
            <form
              key={c.nome}
              className="w-full sm:w-auto sm:flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                definir(c.nome, String(new FormData(e.currentTarget).get(c.nome) ?? "").trim());
              }}
            >
              <input
                type="search"
                name={c.nome}
                defaultValue={params.get(c.nome) ?? ""}
                placeholder={c.placeholder}
                className="campo rounded-full py-2.5"
                onBlur={(e) => e.target.value.trim() !== (params.get(c.nome) ?? "") && definir(c.nome, e.target.value.trim())}
              />
            </form>
          );
        if (c.tipo === "select")
          return (
            <select
              key={c.nome}
              aria-label={c.rotulo}
              value={params.get(c.nome) ?? ""}
              onChange={(e) => definir(c.nome, e.target.value)}
              className={`campo w-auto max-w-[220px] rounded-full py-2.5 pr-8 text-sm font-semibold ${params.get(c.nome) ? "border-azul text-azul" : ""}`}
            >
              <option value="">{c.rotulo}</option>
              {c.opcoes.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
            </select>
          );
        const on = params.get(c.nome) === "1";
        return (
          <button
            key={c.nome}
            type="button"
            aria-pressed={on}
            onClick={() => definir(c.nome, on ? "" : "1")}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold ring-1 transition ${on ? "bg-azul text-white ring-azul" : "bg-white text-cinza-escuro ring-linha"}`}
          >
            {c.rotulo}
          </button>
        );
      })}
      {algum && (
        <button type="button" onClick={() => iniciar(() => router.replace(pathname, { scroll: false }))} className="px-2 text-sm font-semibold text-cinza hover:text-tinta">
          Limpar
        </button>
      )}
    </div>
  );
}
