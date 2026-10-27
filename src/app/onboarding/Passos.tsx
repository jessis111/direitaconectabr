"use client";

import { useActionState, useEffect, useState } from "react";
import { Aviso } from "@/components/Aviso";
import { Avatar } from "@/components/Avatar";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { LIMITE_CATEGORIAS } from "@/lib/constantes";
import type { Categoria, Membro } from "@/lib/types";
import { concluirOnboarding, salvarCategorias, salvarFotoTitulo, type EstadoPasso } from "./actions";

const ROTULOS = ["Foto e título", "Categorias", "Serviços"];

export function Passos({ membro, categorias }: { membro: Membro; categorias: Categoria[] }) {
  const [passo, setPasso] = useState(0);
  const [e1, acao1] = useActionState<EstadoPasso, FormData>(salvarFotoTitulo, {});
  const [e2, acao2] = useActionState<EstadoPasso, FormData>(salvarCategorias, {});
  const [previa, setPrevia] = useState<string | null>(membro.foto_url);
  const [marcadas, setMarcadas] = useState<string[]>(membro.categorias);

  useEffect(() => {
    if (e1.ok) setPasso(1);
  }, [e1]);
  useEffect(() => {
    if (e2.ok) setPasso(2);
  }, [e2]);

  return (
    <div>
      <ol className="mb-8 flex items-center gap-3 text-sm font-semibold">
        {ROTULOS.map((r, i) => (
          <li key={r} className="flex items-center gap-3">
            <span className={`marca text-2xl ${i <= passo ? "text-amarelo" : "text-white/35"}`}>{String(i + 1).padStart(2, "0")}</span>
            <span className={`hidden sm:inline ${i === passo ? "text-white" : "text-white/55"}`}>{r}</span>
            {i < ROTULOS.length - 1 && <span className="h-px w-6 bg-white/30" />}
          </li>
        ))}
      </ol>

      <div className="rounded-[24px] bg-white p-6 text-tinta sm:p-9">
        {passo === 0 && (
          <form action={acao1} className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Bem-vindo, {membro.nome.split(" ")[0]}.</h1>
              <p className="mt-2 text-sm text-cinza">Uma foto e uma linha sobre o que você faz. É assim que os outros membros vão te encontrar.</p>
            </div>
            <label className="flex cursor-pointer items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {previa ? <img src={previa} alt="" className="size-20 rounded-full object-cover" /> : <Avatar nome={membro.nome} url={null} tamanho="lg" />}
              <span className="btn btn-secundario btn-pequeno">{previa ? "Trocar foto" : "Escolher foto"}</span>
              <input
                type="file"
                name="foto"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  if (f) setPrevia(URL.createObjectURL(f));
                }}
              />
            </label>
            <div>
              <label htmlFor="titulo" className="rotulo">Título curto</label>
              <input id="titulo" name="titulo" required maxLength={80} defaultValue={membro.titulo ?? ""} placeholder="Ex.: Contador em BH" className="campo" />
            </div>
            <div>
              <label htmlFor="bio" className="rotulo">Sobre você (opcional)</label>
              <textarea id="bio" name="bio" maxLength={500} rows={3} defaultValue={membro.bio ?? ""} className="campo resize-none" />
            </div>
            {e1.erro && <Aviso>{e1.erro}</Aviso>}
            <div className="flex items-center justify-between gap-3">
              <PularForm />
              <BotaoEnviar pendente="Salvando...">Continuar</BotaoEnviar>
            </div>
          </form>
        )}

        {passo === 1 && (
          <form action={acao2} className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Onde você atua?</h1>
              <p className="mt-2 text-sm text-cinza">Escolha até {LIMITE_CATEGORIAS} categorias.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {categorias.map((c) => {
                const on = marcadas.includes(c.id);
                const cheio = !on && marcadas.length >= LIMITE_CATEGORIAS;
                return (
                  <label key={c.id} className={cheio ? "cursor-not-allowed opacity-45" : "cursor-pointer"}>
                    <input
                      type="checkbox"
                      name="categorias"
                      value={c.id}
                      checked={on}
                      disabled={cheio}
                      onChange={() => setMarcadas((m) => (on ? m.filter((x) => x !== c.id) : [...m, c.id]))}
                      className="peer sr-only"
                    />
                    <span className="inline-block rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-linha transition peer-checked:bg-azul peer-checked:text-white peer-checked:ring-azul peer-focus-visible:outline-2 peer-focus-visible:outline-azul-claro">
                      {c.nome}
                    </span>
                  </label>
                );
              })}
            </div>
            {e2.erro && <Aviso>{e2.erro}</Aviso>}
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => setPasso(0)} className="text-sm font-semibold text-cinza">Voltar</button>
              <BotaoEnviar pendente="Salvando...">Continuar</BotaoEnviar>
            </div>
          </form>
        )}

        {passo === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Você oferece algum serviço?</h1>
              <p className="mt-2 text-sm text-cinza">
                Cadastre até 5 serviços para aparecer na vitrine. Criador de conteúdo? Escolha a categoria UGC creator.
              </p>
            </div>
            <form className="flex flex-col gap-3 sm:flex-row">
              <BotaoEnviar formAction={concluirOnboarding.bind(null, "servico")} pendente="Abrindo...">Cadastrar meu serviço</BotaoEnviar>
              <button formAction={concluirOnboarding.bind(null, "inicio")} className="btn btn-secundario">Agora não</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function PularForm() {
  return (
    <button formAction={concluirOnboarding.bind(null, "inicio")} formNoValidate className="text-sm font-semibold text-cinza">
      Pular por agora
    </button>
  );
}
