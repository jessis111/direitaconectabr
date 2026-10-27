"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Aviso } from "@/components/Aviso";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { PERFIS, UFS } from "@/lib/constantes";
import { cadastrar, type EstadoLink } from "../actions";
import { ConfirmarCodigo } from "../ConfirmarCodigo";

export function FormCadastro() {
  const [estado, acao] = useActionState<EstadoLink, FormData>(cadastrar, {});
  const [refazer, setRefazer] = useState(false);

  if (estado.enviadoPara && !refazer) {
    return <ConfirmarCodigo email={estado.enviadoPara} volta={estado.volta ?? "/onboarding"} onVoltar={() => setRefazer(true)} />;
  }

  return (
    <form action={(f) => { setRefazer(false); return acao(f); }} className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Faça seu cadastro</h1>
        <p className="mt-2 text-sm text-cinza">Leva um minuto. Depois da aprovação você entra na rede.</p>
      </div>

      <div>
        <label htmlFor="nome" className="rotulo">Nome completo</label>
        <input id="nome" name="nome" required autoComplete="name" className="campo" />
      </div>
      <div>
        <label htmlFor="whatsapp" className="rotulo">WhatsApp com DDD</label>
        <input id="whatsapp" name="whatsapp" required inputMode="tel" autoComplete="tel" placeholder="(31) 99999-9999" className="campo" />
      </div>
      <div>
        <label htmlFor="email" className="rotulo">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="campo" />
      </div>
      <div className="grid grid-cols-[1fr_96px] gap-3">
        <div>
          <label htmlFor="cidade" className="rotulo">Cidade</label>
          <input id="cidade" name="cidade" required autoComplete="address-level2" className="campo" />
        </div>
        <div>
          <label htmlFor="uf" className="rotulo">UF</label>
          <select id="uf" name="uf" required defaultValue="" className="campo">
            <option value="" disabled>UF</option>
            {UFS.map((uf) => <option key={uf}>{uf}</option>)}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="rotulo">Você é</legend>
        <div className="flex flex-wrap gap-2">
          {PERFIS.map((p) => (
            <label key={p.valor} className="cursor-pointer">
              <input type="checkbox" name="perfis" value={p.valor} className="peer sr-only" />
              <span className="inline-block rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-linha transition peer-checked:bg-azul peer-checked:text-white peer-checked:ring-azul peer-focus-visible:outline-2 peer-focus-visible:outline-azul-claro">
                {p.rotulo}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-3 pt-1 text-sm text-cinza-escuro">
        <label className="flex gap-3">
          <input type="checkbox" name="principios" required className="mt-0.5 size-4 accent-azul" />
          <span>
            Compartilho os princípios da rede: livre iniciativa, trabalho, família, propriedade e Brasil.{" "}
            <Link href="/termos" target="_blank" className="font-semibold text-azul">Ler princípios</Link>
          </span>
        </label>
        <label className="flex gap-3">
          <input type="checkbox" name="lgpd" required className="mt-0.5 size-4 accent-azul" />
          <span>Autorizo o uso dos meus dados para participar da rede, conforme a LGPD.</span>
        </label>
      </div>

      {estado.erro && <Aviso>{estado.erro}</Aviso>}

      <BotaoEnviar className="btn btn-primario w-full" pendente="Enviando...">Quero entrar na rede</BotaoEnviar>
      <p className="text-center text-sm text-cinza">
        Já tem cadastro? <Link href="/entrar" className="font-semibold text-azul">Entrar</Link>
      </p>
    </form>
  );
}
