import Link from "next/link";

export function AbasVitrine({ ativa }: { ativa: "servicos" | "creators" }) {
  return (
    <div className="mb-6 inline-flex rounded-full bg-white p-1 ring-1 ring-linha">
      {[
        { id: "servicos", href: "/servicos", rotulo: "Todos os serviços" },
        { id: "creators", href: "/creators", rotulo: "UGC creators" },
      ].map((a) => (
        <Link
          key={a.id}
          href={a.href}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${ativa === a.id ? "bg-azul text-white" : "text-cinza hover:text-tinta"}`}
        >
          {a.rotulo}
        </Link>
      ))}
    </div>
  );
}
