"use client";

import { useActionState, useState } from "react";
import { denunciar, type EstadoDenuncia } from "@/app/(app)/denuncia-actions";
import { Aviso } from "./Aviso";
import { BotaoEnviar } from "./BotaoEnviar";

export function Denunciar({ alvoTipo, alvoId }: { alvoTipo: "oportunidade" | "membro" | "servico"; alvoId: string }) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao] = useActionState<EstadoDenuncia, FormData>(denunciar, {});

  if (estado.ok) return <p className="text-sm text-cinza">Denúncia enviada. Obrigado por cuidar da rede.</p>;
  if (!aberto)
    return (
      <button type="button" onClick={() => setAberto(true)} className="text-sm font-semibold text-cinza hover:text-erro">
        Denunciar
      </button>
    );
  return (
    <form action={acao} className="cartao w-full space-y-3 p-4">
      <input type="hidden" name="alvo_tipo" value={alvoTipo} />
      <input type="hidden" name="alvo_id" value={alvoId} />
      <label htmlFor="motivo" className="rotulo">O que aconteceu?</label>
      <textarea id="motivo" name="motivo" rows={3} required minLength={5} maxLength={1000} className="campo resize-none" />
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      <div className="flex gap-2">
        <BotaoEnviar className="btn btn-azul btn-pequeno">Enviar denúncia</BotaoEnviar>
        <button type="button" onClick={() => setAberto(false)} className="btn btn-secundario btn-pequeno">Cancelar</button>
      </div>
    </form>
  );
}
