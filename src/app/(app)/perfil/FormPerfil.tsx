"use client";

import { useActionState, useState } from "react";
import { Aviso } from "@/components/Aviso";
import { Avatar } from "@/components/Avatar";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { LIMITE_CATEGORIAS, PERFIS, UFS } from "@/lib/constantes";
import { formatarTelefone } from "@/lib/formato";
import type { Categoria, Membro } from "@/lib/types";
import { salvarPerfil, type EstadoPerfil } from "./actions";

export function FormPerfil({
  membro,
  categorias,
  email,
  whatsapp,
  telefone,
}: {
  membro: Membro;
  categorias: Categoria[];
  email: string;
  whatsapp: string;
  telefone: string;
}) {
  const [estado, acao] = useActionState<EstadoPerfil, FormData>(salvarPerfil, {});
  const [previa, setPrevia] = useState<string | null>(membro.foto_url);
  const [marcadas, setMarcadas] = useState<string[]>(membro.categorias);

  return (
    <form action={acao} className="space-y-6">
      <section className="cartao space-y-5 p-5 sm:p-7">
        <label className="flex cursor-pointer items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {previa ? <img src={previa} alt="" className="size-[72px] rounded-full object-cover" /> : <Avatar nome={membro.nome} url={null} tamanho="lg" />}
          <span className="btn btn-secundario btn-pequeno">{previa ? "Trocar foto" : "Adicionar foto"}</span>
          <input type="file" name="foto" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPrevia(URL.createObjectURL(f)); }} />
        </label>
        <div>
          <label htmlFor="nome" className="rotulo">Nome</label>
          <input id="nome" name="nome" required defaultValue={membro.nome} className="campo" />
        </div>
        <div>
          <label htmlFor="titulo" className="rotulo">Título curto</label>
          <input id="titulo" name="titulo" maxLength={80} defaultValue={membro.titulo ?? ""} placeholder="Ex.: Contador em BH" className="campo" />
        </div>
        <div>
          <label htmlFor="bio" className="rotulo">Sobre você</label>
          <textarea id="bio" name="bio" maxLength={500} rows={4} defaultValue={membro.bio ?? ""} className="campo" />
        </div>
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <div>
            <label htmlFor="cidade" className="rotulo">Cidade</label>
            <input id="cidade" name="cidade" defaultValue={membro.cidade ?? ""} className="campo" />
          </div>
          <div>
            <label htmlFor="uf" className="rotulo">UF</label>
            <select id="uf" name="uf" defaultValue={membro.uf ?? ""} className="campo">
              <option value="">UF</option>
              {UFS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <fieldset>
          <legend className="rotulo">Perfil</legend>
          <div className="flex flex-wrap gap-2">
            {PERFIS.map((p) => (
              <label key={p.valor} className="cursor-pointer">
                <input type="checkbox" name="perfis" value={p.valor} defaultChecked={membro.perfis.includes(p.valor)} className="peer sr-only" />
                <span className="inline-block rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-linha transition peer-checked:bg-azul peer-checked:text-white peer-checked:ring-azul peer-focus-visible:outline-2 peer-focus-visible:outline-azul-claro">{p.rotulo}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="cartao p-5 sm:p-7">
        <p className="rotulo">Categorias de atuação (até {LIMITE_CATEGORIAS})</p>
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => {
            const on = marcadas.includes(c.id);
            const cheio = !on && marcadas.length >= LIMITE_CATEGORIAS;
            return (
              <label key={c.id} className={cheio ? "cursor-not-allowed opacity-45" : "cursor-pointer"}>
                <input type="checkbox" name="categorias" value={c.id} checked={on} disabled={cheio} onChange={() => setMarcadas((m) => (on ? m.filter((x) => x !== c.id) : [...m, c.id]))} className="peer sr-only" />
                <span className="inline-block rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-linha transition peer-checked:bg-azul peer-checked:text-white peer-checked:ring-azul peer-focus-visible:outline-2 peer-focus-visible:outline-azul-claro">{c.nome}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="cartao space-y-5 p-5 sm:p-7">
        <div>
          <p className="font-semibold">Contato</p>
          <p className="text-sm text-cinza">WhatsApp e telefone só aparecem para quem tem conversa aberta com você.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="whatsapp" className="rotulo">WhatsApp</label>
            <input id="whatsapp" name="whatsapp" inputMode="tel" defaultValue={whatsapp ? formatarTelefone(whatsapp) : ""} className="campo" />
          </div>
          <div>
            <label htmlFor="telefone" className="rotulo">Telefone (opcional)</label>
            <input id="telefone" name="telefone" inputMode="tel" defaultValue={telefone ? formatarTelefone(telefone) : ""} placeholder="Se for diferente do WhatsApp" className="campo" />
          </div>
          <div>
            <label htmlFor="instagram" className="rotulo">Instagram</label>
            <input id="instagram" name="instagram" defaultValue={membro.instagram ?? ""} placeholder="@seuperfil" className="campo" />
          </div>
          <div>
            <label htmlFor="site" className="rotulo">Site</label>
            <input id="site" name="site" defaultValue={membro.site ?? ""} placeholder="seusite.com.br" className="campo" />
          </div>
        </div>
        <p className="text-sm text-cinza">E-mail de acesso: <strong className="text-tinta">{email}</strong></p>
      </section>

      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {estado.ok && <Aviso tipo="ok">Perfil salvo.</Aviso>}
      <BotaoEnviar pendente="Salvando...">Salvar perfil</BotaoEnviar>
    </form>
  );
}
