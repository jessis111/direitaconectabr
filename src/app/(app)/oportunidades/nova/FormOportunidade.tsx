"use client";

import { useActionState, useState } from "react";
import { Aviso } from "@/components/Aviso";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { FAIXAS_ORCAMENTO, UFS } from "@/lib/constantes";
import type { Categoria, OportunidadeTipo } from "@/lib/types";
import { publicarOportunidade, type EstadoForm } from "../actions";

export function FormOportunidade({
  categorias,
  cidade,
  uf,
  tipoInicial,
}: {
  categorias: Categoria[];
  cidade: string | null;
  uf: string | null;
  tipoInicial: OportunidadeTipo;
}) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(publicarOportunidade, {});
  const [tipo, setTipo] = useState<OportunidadeTipo>(tipoInicial);
  const [remoto, setRemoto] = useState(false);
  const [faixa, setFaixa] = useState("");
  const ugc = tipo === "campanha_ugc";

  return (
    <form action={acao} className="cartao space-y-5 p-5 sm:p-8">
      <fieldset>
        <legend className="rotulo">Tipo</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: "geral", t: "Oportunidade", d: "Serviço, compra, parceria" },
            { v: "campanha_ugc", t: "Campanha UGC", d: "Creators para a sua marca" },
          ].map((o) => (
            <label key={o.v} className="cursor-pointer">
              <input type="radio" name="tipo" value={o.v} checked={tipo === o.v} onChange={() => setTipo(o.v as OportunidadeTipo)} className="peer sr-only" />
              <span className="block rounded-2xl p-4 ring-1 ring-linha transition peer-checked:ring-2 peer-checked:ring-azul peer-focus-visible:outline-2 peer-focus-visible:outline-azul-claro">
                <span className="block font-semibold">{o.t}</span>
                <span className="block text-sm text-cinza">{o.d}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="titulo" className="rotulo">Título</label>
        <input id="titulo" name="titulo" required minLength={5} maxLength={120} placeholder={ugc ? "Ex.: 3 vídeos de review para loja de roupas" : "Ex.: Preciso de contador para abrir empresa"} className="campo" />
      </div>
      <div>
        <label htmlFor="descricao" className="rotulo">{ugc ? "Briefing" : "Descrição"}</label>
        <textarea id="descricao" name="descricao" required minLength={10} maxLength={3000} rows={6} placeholder={ugc ? "Produto, público, tom, o que precisa aparecer no vídeo..." : "O que você precisa, quando e qualquer detalhe que ajude quem vai mandar proposta."} className="campo" />
      </div>

      {ugc ? (
        <div>
          <label htmlFor="entregas" className="rotulo">Quantidade de entregas</label>
          <input id="entregas" name="entregas" type="number" min={1} max={1000} placeholder="Ex.: 3" className="campo max-w-40" />
        </div>
      ) : (
        <div>
          <label htmlFor="categoria_id" className="rotulo">Categoria</label>
          <select id="categoria_id" name="categoria_id" required defaultValue="" className="campo">
            <option value="" disabled>Escolha</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="remoto" checked={remoto} onChange={(e) => setRemoto(e.target.checked)} className="size-4 accent-azul" />
          Pode ser feito à distância (remoto)
        </label>
        {!remoto && (
          <div className="grid grid-cols-[1fr_96px] gap-3">
            <div>
              <label htmlFor="cidade" className="rotulo">Cidade</label>
              <input id="cidade" name="cidade" defaultValue={cidade ?? ""} required className="campo" />
            </div>
            <div>
              <label htmlFor="uf" className="rotulo">UF</label>
              <select id="uf" name="uf" defaultValue={uf ?? ""} required className="campo">
                <option value="" disabled>UF</option>
                {UFS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="faixa" className="rotulo">Orçamento (opcional)</label>
          <select id="faixa" name="faixa" value={faixa} onChange={(e) => setFaixa(e.target.value)} className="campo">
            <option value="">A combinar</option>
            {FAIXAS_ORCAMENTO.map((f, i) => <option key={f.rotulo} value={i}>{f.rotulo}</option>)}
            <option value="livre">Outro valor</option>
          </select>
        </div>
        <div>
          <label htmlFor="prazo" className="rotulo">Prazo (opcional)</label>
          <input id="prazo" name="prazo" type="date" min={new Date().toISOString().slice(0, 10)} className="campo" />
        </div>
      </div>
      {faixa === "livre" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="orcamento_min" className="rotulo">De (R$)</label>
            <input id="orcamento_min" name="orcamento_min" inputMode="decimal" className="campo" />
          </div>
          <div>
            <label htmlFor="orcamento_max" className="rotulo">Até (R$)</label>
            <input id="orcamento_max" name="orcamento_max" inputMode="decimal" className="campo" />
          </div>
        </div>
      )}

      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      <BotaoEnviar className="btn btn-primario w-full sm:w-auto" pendente="Publicando...">Publicar</BotaoEnviar>
    </form>
  );
}
