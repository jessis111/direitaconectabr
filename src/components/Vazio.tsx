import Link from "next/link";

export function Vazio({
  titulo,
  texto,
  acao,
}: {
  titulo: string;
  texto?: string;
  acao?: { href: string; rotulo: string };
}) {
  return (
    <div className="rounded-[18px] border border-dashed border-apagado px-6 py-14 text-center">
      <p className="text-lg font-semibold">{titulo}</p>
      {texto && <p className="mx-auto mt-2 max-w-sm text-sm text-cinza">{texto}</p>}
      {acao && (
        <Link href={acao.href} className="btn btn-primario mt-6">
          {acao.rotulo}
        </Link>
      )}
    </div>
  );
}
