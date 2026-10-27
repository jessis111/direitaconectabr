import Link from "next/link";

export function Paginacao({
  pagina,
  total,
  porPagina,
  params,
}: {
  pagina: number;
  total: number;
  porPagina: number;
  params: Record<string, string | undefined>;
}) {
  const paginas = Math.ceil(total / porPagina);
  if (paginas <= 1) return null;
  const link = (p: number) => {
    const u = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1] && e[0] !== "pagina"));
    if (p > 1) u.set("pagina", String(p));
    return `?${u}`;
  };
  return (
    <nav className="mt-8 flex items-center justify-center gap-3 text-sm" aria-label="Paginação">
      {pagina > 1 && <Link href={link(pagina - 1)} className="btn btn-secundario btn-pequeno">Anterior</Link>}
      <span className="text-cinza">Página {pagina} de {paginas}</span>
      {pagina < paginas && <Link href={link(pagina + 1)} className="btn btn-secundario btn-pequeno">Próxima</Link>}
    </nav>
  );
}
