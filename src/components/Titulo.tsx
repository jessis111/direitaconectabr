export function Titulo({
  titulo,
  sub,
  acao,
}: {
  titulo: string;
  sub?: React.ReactNode;
  acao?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{titulo}</h1>
        {sub && <p className="mt-1.5 text-sm text-cinza">{sub}</p>}
      </div>
      {acao}
    </div>
  );
}
