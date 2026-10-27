import Link from "next/link";

export function Marca({ className = "", href = "/" }: { className?: string; href?: string | null }) {
  const conteudo = (
    <span className={`marca whitespace-nowrap ${className}`}>
      Direita Conecta <span className="font-medium opacity-85">br</span>
    </span>
  );
  return href ? (
    <Link href={href} aria-label="Direita Conecta br, início">
      {conteudo}
    </Link>
  ) : (
    conteudo
  );
}
