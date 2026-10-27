"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Aviso } from "@/components/Aviso";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { entrar, type EstadoLink } from "../actions";
import { ConfirmarCodigo } from "../ConfirmarCodigo";

export function FormEntrar({ volta, erroLink }: { volta: string; erroLink: boolean }) {
  const [estado, acao] = useActionState<EstadoLink, FormData>(entrar, {});
  const [refazer, setRefazer] = useState(false);

  if (estado.enviadoPara && !refazer) {
    return <ConfirmarCodigo email={estado.enviadoPara} volta={estado.volta ?? volta} onVoltar={() => setRefazer(true)} />;
  }

  return (
    <form action={(f) => { setRefazer(false); return acao(f); }} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
        <p className="mt-2 text-sm text-cinza">Sem senha. A gente manda um link de acesso para o seu e-mail.</p>
      </div>
      <input type="hidden" name="volta" value={volta} />
      <div>
        <label htmlFor="email" className="rotulo">E-mail do cadastro</label>
        <input id="email" name="email" type="email" required autoComplete="email" autoFocus className="campo" />
      </div>
      {erroLink && !estado.erro && <Aviso>O link expirou ou já foi usado. Peça um novo abaixo.</Aviso>}
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      <BotaoEnviar className="btn btn-primario w-full" pendente="Enviando...">Receber link de acesso</BotaoEnviar>
      <p className="text-center text-sm text-cinza">
        Ainda não é membro? <Link href="/cadastro" className="font-semibold text-azul">Fazer cadastro</Link>
      </p>
    </form>
  );
}
