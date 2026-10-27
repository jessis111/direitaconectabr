export function Tag({
  children,
  cor = "neutra",
}: {
  children: React.ReactNode;
  cor?: "neutra" | "azul" | "amarela" | "verde" | "apagada";
}) {
  const estilos = {
    neutra: "bg-off text-cinza-escuro",
    azul: "bg-azul/8 text-azul",
    amarela: "bg-amarelo/25 text-amarelo-tinta",
    verde: "bg-verde/12 text-verde",
    apagada: "bg-apagado/50 text-cinza",
  }[cor];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${estilos}`}>{children}</span>;
}
