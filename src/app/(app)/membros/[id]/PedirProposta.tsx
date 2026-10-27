"use client";

import { useActionState } from "react";
import { Aviso } from "@/components/Aviso";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { pedirProposta, type EstadoPedido } from "../../servicos/actions";

export function PedirProposta({
  servicos,
  inicial,
  nome,
}: {
  servicos: { id: string; nome: string }[];
  inicial?: string;
  nome: string;
}) {
  const [estado, acao] = useActionState<EstadoPedido, FormData>(pedirProposta, {});
  const padrao = servicos.some((s) => s.id === inicial) ? inicial : servicos[0]?.id;
  return (
    <form action={acao} className="cartao space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Pedir proposta para {nome}</h2>
        <p className="mt-1 text-sm text-cinza">O pedido abre uma conversa na plataforma. O WhatsApp fica disponível lá dentro.</p>
      </div>
      {servicos.length > 1 ? (
        <div>
          <label htmlFor="servico_id" className="rotulo">Serviço</label>
          <select id="servico_id" name="servico_id" defaultValue={padrao} className="campo">
            {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
      ) : (
        <input type="hidden" name="servico_id" value={padrao} />
      )}
      <div>
        <label htmlFor="mensagem" className="rotulo">O que você precisa</label>
        <textarea id="mensagem" name="mensagem" required minLength={10} maxLength={2000} rows={4} className="campo" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="valor" className="rotulo">Orçamento (opcional)</label>
          <input id="valor" name="valor" inputMode="decimal" placeholder="R$" className="campo" />
        </div>
        <div>
          <label htmlFor="prazo" className="rotulo">Prazo (opcional)</label>
          <input id="prazo" name="prazo" maxLength={80} placeholder="Ex.: até sexta" className="campo" />
        </div>
      </div>
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      <BotaoEnviar pendente="Enviando...">Pedir proposta</BotaoEnviar>
    </form>
  );
}
