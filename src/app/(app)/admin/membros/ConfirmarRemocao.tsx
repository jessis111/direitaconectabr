"use client";

import { useState } from "react";
import { BotaoEnviar } from "@/components/BotaoEnviar";

export function ConfirmarRemocao({ id, nome, acao }: { id: string; nome: string; acao: (f: FormData) => Promise<void> }) {
  const [confirmar, setConfirmar] = useState(false);
  if (!confirmar)
    return (
      <button type="button" onClick={() => setConfirmar(true)} className="btn btn-pequeno text-cinza hover:text-erro">
        Remover
      </button>
    );
  return (
    <form action={acao} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-xs text-erro">Remover {nome.split(" ")[0]} e tudo dele?</span>
      <BotaoEnviar className="btn btn-pequeno bg-erro text-white" pendente="...">Sim</BotaoEnviar>
      <button type="button" onClick={() => setConfirmar(false)} className="btn btn-secundario btn-pequeno">Não</button>
    </form>
  );
}
