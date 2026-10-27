"use client";

import { ImagePlus, MessageCircle, Phone, SendHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { hora, linkWhatsApp, telefoneInternacional } from "@/lib/formato";
import { createClient } from "@/lib/supabase/client";
import type { Mensagem } from "@/lib/types";

// Imagens do chat ficam no bucket privado "chat"; imagem_url guarda o caminho.
function useImagemAssinada(caminho: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!caminho) return;
    let vivo = true;
    createClient()
      .storage.from("chat")
      .createSignedUrl(caminho, 60 * 60)
      .then(({ data }) => vivo && setUrl(data?.signedUrl ?? null));
    return () => {
      vivo = false;
    };
  }, [caminho]);
  return url;
}

function Imagem({ caminho }: { caminho: string }) {
  const url = useImagemAssinada(caminho);
  if (!url) return <div className="h-48 w-56 animate-pulse rounded-xl bg-black/10" />;
  return (
    <a href={url} target="_blank" rel="noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Imagem enviada" className="max-h-72 max-w-full rounded-xl object-cover" />
    </a>
  );
}

function dia(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(Date.now() - 86400000);
  if (d.toDateString() === hoje.toDateString()) return "Hoje";
  if (d.toDateString() === ontem.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

export function Chat({
  conversaId,
  eu,
  outroNome,
  iniciais,
  whatsapp,
  telefone,
  mensagemWhatsApp,
}: {
  conversaId: string;
  eu: string;
  outroNome: string;
  iniciais: Mensagem[];
  whatsapp: string | null;
  telefone: string | null;
  mensagemWhatsApp: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [mensagens, setMensagens] = useState<Mensagem[]>(iniciais);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canal = supabase
      .channel(`conversa:${conversaId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversa_id=eq.${conversaId}` },
        (payload) => {
          const nova = payload.new as Mensagem;
          setMensagens((m) => (m.some((x) => x.id === nova.id) ? m : [...m, nova]));
          if (nova.de_id !== eu && document.visibilityState === "visible") {
            supabase.rpc("marcar_lidas", { conversa: conversaId });
          }
        },
      )
      .subscribe();
    const aoVoltar = () => document.visibilityState === "visible" && supabase.rpc("marcar_lidas", { conversa: conversaId });
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      document.removeEventListener("visibilitychange", aoVoltar);
      supabase.removeChannel(canal);
    };
  }, [supabase, conversaId, eu]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [mensagens.length]);

  async function enviar(conteudo: { texto?: string; imagem_url?: string }) {
    setErro(null);
    setEnviando(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversa_id: conversaId, de_id: eu, ...conteudo })
      .select("*")
      .single();
    setEnviando(false);
    if (error || !data) {
      setErro("Mensagem não enviada. Tente de novo.");
      return false;
    }
    setMensagens((m) => (m.some((x) => x.id === data.id) ? m : [...m, data as Mensagem]));
    return true;
  }

  async function enviarTexto(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || enviando) return;
    setTexto("");
    if (!(await enviar({ texto: t.slice(0, 4000) }))) setTexto(t);
  }

  async function enviarImagem(arquivo: File | undefined) {
    if (!arquivo) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) return setErro("Envie uma imagem JPG, PNG ou WebP.");
    if (arquivo.size > 10 * 1024 * 1024) return setErro("A imagem precisa ter até 10 MB.");
    setEnviando(true);
    const ext = arquivo.type.split("/")[1].replace("jpeg", "jpg");
    const caminho = `${conversaId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("chat").upload(caminho, arquivo, { contentType: arquivo.type });
    if (error) {
      setEnviando(false);
      return setErro("Não foi possível enviar a imagem.");
    }
    await enviar({ imagem_url: caminho });
  }

  let diaAnterior = "";

  return (
    <>
      <div className="flex-1 overflow-y-auto border-x border-linha bg-white px-4 py-4">
        {mensagens.length === 0 && (
          <p className="mx-auto mt-10 max-w-xs text-center text-sm text-cinza">
            Comece a conversa com {outroNome.split(" ")[0]}. Tire as dúvidas aqui e, quando decidir, use os botões abaixo.
          </p>
        )}
        <ul className="space-y-1.5">
          {mensagens.map((m) => {
            const minha = m.de_id === eu;
            const d = dia(m.criado_em);
            const separador = d !== diaAnterior;
            diaAnterior = d;
            return (
              <li key={m.id}>
                {separador && <p className="my-4 text-center text-xs font-semibold text-cinza">{d}</p>}
                <div className={`flex ${minha ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${minha ? "rounded-br-md bg-azul text-white" : "rounded-bl-md bg-off text-tinta"}`}>
                    {m.imagem_url && <Imagem caminho={m.imagem_url} />}
                    {m.texto && <p className="whitespace-pre-wrap break-words text-[0.9375rem] leading-snug">{m.texto}</p>}
                    <p className={`mt-0.5 text-right text-[10px] ${minha ? "text-white/70" : "text-cinza"}`}>
                      {hora(m.criado_em)}
                      {minha && m.lida_em && " · lida"}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div ref={fim} />
      </div>

      <div className="cartao rounded-t-none border-t-0 p-3">
        <div className="mb-3 flex gap-2">
          {telefone && (
            <a href={`tel:+${telefoneInternacional(telefone)}`} className="btn btn-secundario btn-pequeno flex-1">
              <Phone size={16} strokeWidth={1.75} /> Ligar
            </a>
          )}
          {whatsapp && (
            <a href={linkWhatsApp(whatsapp, mensagemWhatsApp)} target="_blank" rel="noreferrer" className="btn btn-primario btn-pequeno flex-1">
              <MessageCircle size={16} strokeWidth={1.75} /> Chamar no WhatsApp
            </a>
          )}
        </div>
        {erro && <p className="mb-2 text-sm text-erro">{erro}</p>}
        <form onSubmit={enviarTexto} className="flex items-end gap-2">
          <label className="cursor-pointer rounded-full p-2.5 text-cinza hover:bg-off hover:text-tinta" aria-label="Enviar imagem">
            <ImagePlus size={22} strokeWidth={1.5} />
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={enviando} onChange={(e) => { enviarImagem(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            maxLength={4000}
            placeholder="Escreva uma mensagem"
            className="campo max-h-32 min-h-[44px] flex-1 resize-none rounded-[22px] py-2.5"
          />
          <button type="submit" disabled={enviando || !texto.trim()} aria-label="Enviar" className="btn btn-azul size-11 shrink-0 p-0">
            <SendHorizontal size={18} strokeWidth={1.75} />
          </button>
        </form>
      </div>
    </>
  );
}
