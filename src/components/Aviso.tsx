export function Aviso({ tipo = "erro", children }: { tipo?: "erro" | "ok" | "info"; children: React.ReactNode }) {
  const estilos = {
    erro: "bg-erro/8 text-erro",
    ok: "bg-verde/10 text-verde",
    info: "bg-azul/8 text-azul",
  }[tipo];
  return (
    <p role={tipo === "erro" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm font-medium ${estilos}`}>
      {children}
    </p>
  );
}
