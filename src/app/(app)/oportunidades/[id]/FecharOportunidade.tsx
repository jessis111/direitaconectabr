"use client";

import { useState } from "react";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { mudarStatus } from "../actions";

export function FecharOportunidade({ id, candidatos }: { id: string; candidatos: { id: string; nome: string }[] }) {
  const [aberto, setAberto] = useState(false);
  if (!aberto)
    return (
      <button type="button" onClick={() => setAberto(true)} className="btn btn-azul btn-pequeno w-full">
        Marcar como fechada
      </button>
    );
  return (
    <form action={mudarStatus} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value="fechada" />
      <label htmlFor="fechada_com_id" className="rotulo">Fechou negócio com alguém da rede?</label>
      <select id="fechada_com_id" name="fechada_com_id" defaultValue="" className="campo">
        <option value="">Não fechei pela rede</option>
        {candidatos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
      <div className="flex gap-2">
        <BotaoEnviar className="btn btn-azul btn-pequeno" pendente="Salvando...">Confirmar</BotaoEnviar>
        <button type="button" onClick={() => setAberto(false)} className="btn btn-secundario btn-pequeno">Cancelar</button>
      </div>
    </form>
  );
}
