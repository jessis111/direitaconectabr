"use client";

import { useActionState } from "react";
import { Aviso } from "@/components/Aviso";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { confirmarCodigo, type EstadoLink } from "./actions";

export function ConfirmarCodigo({ email, volta, onVoltar }: { email: string; volta: string; onVoltar: () => void }) {
  const [estado, acao] = useActionState<EstadoLink, FormData>(confirmarCodigo, {});
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Confira seu e-mail</h1>
      <p className="mt-3 text-cinza">
        Mandamos um link de acesso para <strong className="text-tinta">{email}</strong>. Toque nele para entrar. Se preferir,
        digite o código que veio no mesmo e-mail.
      </p>
      <form action={acao} className="mt-7 space-y-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="volta" value={volta} />
        <div>
          <label htmlFor="codigo" className="rotulo">
            Código
          </label>
          <input
            id="codigo"
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            placeholder="000000"
            className="campo text-center text-2xl tracking-[0.4em]"
          />
        </div>
        {estado.erro && <Aviso>{estado.erro}</Aviso>}
        <BotaoEnviar className="btn btn-primario w-full" pendente="Conferindo...">
          Entrar
        </BotaoEnviar>
      </form>
      <button type="button" onClick={onVoltar} className="mt-5 text-sm font-semibold text-azul">
        Usar outro e-mail
      </button>
    </div>
  );
}
