import "server-only";
import { Resend } from "resend";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function layout(titulo: string, corpo: string, cta: { texto: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f7f5f0;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#0b1a3f">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;border:1px solid #e6e1d6">
<tr><td style="padding:28px 32px 8px;font-family:Outfit,Arial,sans-serif;font-weight:600;font-size:20px;letter-spacing:-0.02em;color:#1247d8">Direita Conecta <span style="font-weight:500;opacity:.85">br</span></td></tr>
<tr><td style="padding:8px 32px 0;font-size:22px;font-weight:700;line-height:1.3">${titulo}</td></tr>
<tr><td style="padding:12px 32px 0;font-size:15px;line-height:1.6;color:#4a5775">${corpo}</td></tr>
<tr><td style="padding:24px 32px 32px"><a href="${cta.url}" style="display:inline-block;background:#ffc532;color:#2b2100;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">${cta.texto}</a></td></tr>
</table>
<p style="font-size:12px;color:#6b7a99;margin-top:16px">Você recebe este aviso porque é membro da Direita Conecta br.</p>
</td></tr></table></body></html>`;
}

function escapar(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

async function enviar(para: string, assunto: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.info(`[email desativado] ${para}: ${assunto}`);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Direita Conecta br <onboarding@resend.dev>",
    to: para,
    subject: assunto,
    html,
  });
  if (error) console.error("Falha ao enviar e-mail", error);
}

export async function avisarProposta(params: {
  para: string;
  deNome: string;
  titulo: string;
  url: string;
  pedidoServico: boolean;
}) {
  const assunto = params.pedidoServico
    ? `${params.deNome} pediu uma proposta`
    : `Nova proposta em "${params.titulo}"`;
  const corpo = params.pedidoServico
    ? `<strong>${escapar(params.deNome)}</strong> pediu uma proposta para o seu serviço <strong>${escapar(params.titulo)}</strong>. A conversa já está aberta na plataforma.`
    : `<strong>${escapar(params.deNome)}</strong> mandou uma proposta na sua oportunidade <strong>${escapar(params.titulo)}</strong>.`;
  await enviar(params.para, assunto, layout(escapar(assunto), corpo, { texto: "Ver na plataforma", url: `${SITE}${params.url}` }));
}

export async function avisarMensagens(params: { para: string; nome: string; quantidade: number; de: string[] }) {
  const quem = params.de.slice(0, 3).map(escapar).join(", ");
  const assunto =
    params.quantidade === 1 ? "Você tem uma mensagem nova" : `Você tem ${params.quantidade} mensagens novas`;
  const corpo = `Olá, ${escapar(params.nome.split(" ")[0])}. ${quem} ${params.de.length > 1 ? "mandaram" : "mandou"} mensagem para você na Direita Conecta br.`;
  await enviar(params.para, assunto, layout(assunto, corpo, { texto: "Abrir conversas", url: `${SITE}/conversas` }));
}

export async function avisarAprovacao(params: { para: string; nome: string }) {
  const assunto = "Seu cadastro foi aprovado";
  const corpo = `Bem-vindo, ${escapar(params.nome.split(" ")[0])}. Seu acesso à Direita Conecta br está liberado. Complete seu perfil para aparecer na busca e comece a fazer negócio com os nossos.`;
  await enviar(params.para, assunto, layout(assunto, corpo, { texto: "Entrar", url: `${SITE}/entrar` }));
}
