"use client";

import { useActionState } from "react";
import { Aviso } from "@/components/Aviso";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { enviarProposta, type EstadoForm } from "../actions";

export function FormProposta({ oportunidadeId }: { oportunidadeId: string }) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(enviarProposta, {});
  if (estado.ok) return <Aviso tipo="ok">Proposta enviada. Você vai saber quando a conversa for aberta.</Aviso>;
  return (
    <form action={acao} className="cartao mt-12 space-y-4 p-5 sm:p-6">
      <h2 className="text-xl font-bold tracking-tight">Mandar proposta</h2>
      <input type="hidden" name="oportunidade_id" value={oportunidadeId} />
      <div>
        <label htmlFor="mensagem" className="rotulo">Mensagem</label>
        <textarea id="mensagem" name="mensagem" required minLength={10} maxLength={2000} rows={5} placeholder="Como você resolve isso, sua experiência e o que precisa saber." className="campo" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="valor" className="rotulo">Valor (opcional)</label>
          <input id="valor" name="valor" inputMode="decimal" placeholder="R$" className="campo" />
        </div>
        <div>
          <label htmlFor="prazo" className="rotulo">Prazo (opcional)</label>
          <input id="prazo" name="prazo" maxLength={80} placeholder="Ex.: 10 dias" className="campo" />
        </div>
      </div>
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      <BotaoEnviar pendente="Enviando...">Enviar proposta</BotaoEnviar>
    </form>
  );
}
