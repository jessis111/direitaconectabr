"use client";

import { X } from "lucide-react";
import { useActionState, useState } from "react";
import { Aviso } from "@/components/Aviso";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { Midia } from "@/components/Midia";
import { FORMATOS_PADRAO, LIMITE_PORTFOLIO, NICHOS_PADRAO } from "@/lib/constantes";
import { createClient } from "@/lib/supabase/client";
import type { Categoria, ItemPortfolio, Servico } from "@/lib/types";
import { salvarServico, type EstadoServico } from "./actions";

const LIMITE_VIDEO_MB = 50;

export function FormServico({
  membroId,
  categorias,
  ugc,
  servico,
  categoriaInicial,
}: {
  membroId: string;
  categorias: Categoria[];
  ugc: Categoria | null;
  servico?: Servico;
  categoriaInicial?: string;
}) {
  const [estado, acao] = useActionState<EstadoServico, FormData>(salvarServico, {});
  const [categoria, setCategoria] = useState(servico?.categoria_id ?? categoriaInicial ?? "");
  const [nichos, setNichos] = useState<string[]>(servico?.nichos ?? []);
  const [portfolio, setPortfolio] = useState<ItemPortfolio[]>(servico?.portfolio ?? []);
  const [enviados, setEnviados] = useState<{ url: string; tipo: string }[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erroUpload, setErroUpload] = useState<string | null>(null);
  const ehUgc = !!ugc && categoria === ugc.id;
  const listaNichos = ugc?.campos_extras?.nichos ?? NICHOS_PADRAO;
  const listaFormatos = ugc?.campos_extras?.formatos ?? FORMATOS_PADRAO;
  const total = portfolio.length + enviados.length;

  async function enviarArquivos(arquivos: FileList | null) {
    if (!arquivos?.length) return;
    setErroUpload(null);
    const vagas = LIMITE_PORTFOLIO - total;
    const lista = Array.from(arquivos).slice(0, vagas);
    const grande = lista.find((f) => f.size > LIMITE_VIDEO_MB * 1024 * 1024);
    if (grande) {
      setErroUpload(`"${grande.name}" passa de ${LIMITE_VIDEO_MB} MB. Use um link do Instagram, TikTok ou YouTube.`);
      return;
    }
    setEnviando(true);
    const supabase = createClient();
    try {
      for (const f of lista) {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "bin";
        const caminho = `${membroId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("portfolio").upload(caminho, f, { contentType: f.type });
        if (error) throw error;
        const url = supabase.storage.from("portfolio").getPublicUrl(caminho).data.publicUrl;
        setEnviados((e) => [...e, { url, tipo: f.type }]);
      }
    } catch {
      setErroUpload("Não foi possível enviar um dos arquivos. Use JPG, PNG, WebP ou vídeo MP4.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form action={acao} className="space-y-6">
      {servico && <input type="hidden" name="id" value={servico.id} />}
      <section className="cartao space-y-5 p-5 sm:p-7">
        <div>
          <label htmlFor="categoria_id" className="rotulo">Categoria</label>
          <select id="categoria_id" name="categoria_id" required value={categoria} onChange={(e) => setCategoria(e.target.value)} className="campo">
            <option value="" disabled>Escolha</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="nome" className="rotulo">Nome do serviço</label>
          <input id="nome" name="nome" required minLength={3} maxLength={80} defaultValue={servico?.nome} placeholder={ehUgc ? "Ex.: Vídeos de review para marcas de moda" : "Ex.: Abertura de empresa e contabilidade mensal"} className="campo" />
        </div>
        <div>
          <label htmlFor="descricao" className="rotulo">Descrição curta</label>
          <textarea id="descricao" name="descricao" maxLength={300} rows={3} defaultValue={servico?.descricao ?? ""} className="campo" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="preco_min" className="rotulo">Preço a partir de (opcional)</label>
            <input id="preco_min" name="preco_min" inputMode="decimal" defaultValue={servico?.preco_min ?? ""} placeholder="R$" className="campo" />
          </div>
          <div>
            <label htmlFor="preco_max" className="rotulo">Até (opcional)</label>
            <input id="preco_max" name="preco_max" inputMode="decimal" defaultValue={servico?.preco_max ?? ""} placeholder="R$" className="campo" />
          </div>
        </div>
        {servico && (
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input type="hidden" name="ativo" value="off" />
            <input type="checkbox" name="ativo" value="on" defaultChecked={servico.ativo} className="size-4 accent-azul" />
            Ativo na vitrine
          </label>
        )}
      </section>

      {ehUgc && (
        <section className="cartao space-y-6 p-5 sm:p-7">
          <div>
            <p className="font-semibold">Seu perfil de creator</p>
            <p className="text-sm text-cinza">Esse serviço aparece também na aba UGC creators.</p>
          </div>
          <fieldset>
            <legend className="rotulo">Nichos (até 3)</legend>
            <div className="flex flex-wrap gap-2">
              {listaNichos.map((n) => {
                const on = nichos.includes(n);
                const cheio = !on && nichos.length >= 3;
                return (
                  <label key={n} className={cheio ? "cursor-not-allowed opacity-45" : "cursor-pointer"}>
                    <input type="checkbox" name="nichos" value={n} checked={on} disabled={cheio} onChange={() => setNichos((x) => (on ? x.filter((y) => y !== n) : [...x, n]))} className="peer sr-only" />
                    <span className="inline-block rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-linha transition peer-checked:bg-azul peer-checked:text-white peer-checked:ring-azul peer-focus-visible:outline-2 peer-focus-visible:outline-azul-claro">{n}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="rotulo">Formatos</legend>
            <div className="flex flex-wrap gap-2">
              {listaFormatos.map((f) => (
                <label key={f} className="cursor-pointer">
                  <input type="checkbox" name="formatos" value={f} defaultChecked={servico?.formatos.includes(f)} className="peer sr-only" />
                  <span className="inline-block rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-linha transition peer-checked:bg-amarelo peer-checked:text-amarelo-tinta peer-checked:ring-amarelo peer-focus-visible:outline-2 peer-focus-visible:outline-azul-claro">{f}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="rotulo">Atendimento</legend>
            <div className="flex gap-5 text-sm font-semibold">
              <label className="flex items-center gap-2"><input type="radio" name="modalidade" value="remoto" defaultChecked={servico?.remoto !== false} className="accent-azul" />Remoto</label>
              <label className="flex items-center gap-2"><input type="radio" name="modalidade" value="presencial" defaultChecked={servico?.remoto === false} className="accent-azul" />Presencial</label>
            </div>
          </fieldset>
          <div>
            <label htmlFor="tiktok" className="rotulo">TikTok (opcional)</label>
            <input id="tiktok" name="tiktok" defaultValue={servico?.tiktok ?? ""} placeholder="@seuperfil" className="campo" />
          </div>

          <div>
            <p className="rotulo">Portfólio ({total} de {LIMITE_PORTFOLIO})</p>
            {(portfolio.length > 0 || enviados.length > 0) && (
              <div className="mb-3 grid grid-cols-3 gap-2">
                {portfolio.map((p, i) => (
                  <div key={p.url} className="relative">
                    <input type="hidden" name="portfolio_atual" value={JSON.stringify(p)} />
                    <Midia item={p} className="aspect-[4/5] w-full rounded-xl" />
                    <button type="button" aria-label="Remover" onClick={() => setPortfolio((x) => x.filter((_, j) => j !== i))} className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-tinta">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {enviados.map((e, i) => (
                  <div key={e.url} className="relative">
                    <input type="hidden" name="portfolio_enviado" value={JSON.stringify(e)} />
                    <Midia item={{ url: e.url, tipo: e.tipo.startsWith("video") ? "video" : "imagem" }} className="aspect-[4/5] w-full rounded-xl" />
                    <button type="button" aria-label="Remover" onClick={() => setEnviados((x) => x.filter((_, j) => j !== i))} className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-tinta">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {total < LIMITE_PORTFOLIO && (
              <label className={`btn btn-secundario btn-pequeno ${enviando ? "opacity-60" : ""}`}>
                {enviando ? "Enviando..." : "Enviar vídeos ou fotos"}
                <input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" disabled={enviando} className="sr-only" onChange={(e) => { enviarArquivos(e.target.files); e.target.value = ""; }} />
              </label>
            )}
            {erroUpload && <p className="mt-2 text-sm text-erro">{erroUpload}</p>}
            <label htmlFor="portfolio_links" className="rotulo mt-4">Ou cole links (um por linha)</label>
            <textarea id="portfolio_links" name="portfolio_links" rows={2} placeholder="https://instagram.com/reel/..." className="campo" />
          </div>
        </section>
      )}

      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      <BotaoEnviar disabled={enviando} pendente="Salvando...">Salvar serviço</BotaoEnviar>
    </form>
  );
}
