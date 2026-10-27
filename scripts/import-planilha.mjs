#!/usr/bin/env node
// Importa os cadastros da planilha "Direita Conecta - Cadastros" como membros aprovados.
//
// 1. No Google Sheets, aba "Cadastros": Arquivo > Fazer download > CSV.
// 2. npm run import:planilha -- caminho/do/arquivo.csv [--teste] [--sem-convite]
//
//   --teste        só mostra o que seria importado, sem gravar nada
//   --sem-convite  cria os membros sem mandar o e-mail com o link de acesso
//
// Precisa de NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SITE_URL
// no ambiente ou no arquivo .env.local. Pode rodar mais de uma vez: quem já existe
// só é marcado como aprovado.

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const f of [".env.local", ".env"]) {
  if (fs.existsSync(f)) process.loadEnvFile(f);
}

const args = process.argv.slice(2);
const arquivo = args.find((a) => !a.startsWith("--"));
const TESTE = args.includes("--teste");
const SEM_CONVITE = args.includes("--sem-convite");

if (!arquivo || !fs.existsSync(arquivo)) {
  console.error("Uso: npm run import:planilha -- cadastros.csv [--teste] [--sem-convite]");
  process.exit(1);
}

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
if (!TESTE && (!URL_SUPABASE || !CHAVE)) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const UFS = new Set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "));

function parseCsv(texto) {
  const sep = (texto.split("\n")[0].match(/;/g)?.length ?? 0) > (texto.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const linhas = [];
  let linha = [];
  let campo = "";
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo); campo = "";
      if (linha.some((v) => v.trim())) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  linha.push(campo);
  if (linha.some((v) => v.trim())) linhas.push(linha);
  return linhas;
}

const normalizar = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function acharColuna(cabecalho, ...nomes) {
  const h = cabecalho.map(normalizar);
  for (const n of nomes) {
    const i = h.findIndex((c) => c === n || c.includes(n));
    if (i >= 0) return i;
  }
  return -1;
}

function perfisDe(texto) {
  const t = normalizar(texto ?? "");
  const p = [];
  if (t.includes("empresari")) p.push("empresario");
  if (t.includes("prestador")) p.push("prestador");
  if (t.includes("profissional")) p.push("profissional");
  return p;
}

function cidadeUf(cidade, uf) {
  let c = (cidade ?? "").trim();
  let u = (uf ?? "").trim().toUpperCase();
  if (!u) {
    const m = c.match(/^(.*?)[\s]*[-/,][\s]*([A-Za-z]{2})$/);
    if (m && UFS.has(m[2].toUpperCase())) { c = m[1].trim(); u = m[2].toUpperCase(); }
  }
  return { cidade: c || null, uf: UFS.has(u) ? u : null };
}

const [cabecalho, ...dados] = parseCsv(fs.readFileSync(arquivo, "utf8").replace(/^﻿/, ""));
const col = {
  nome: acharColuna(cabecalho, "nome"),
  email: acharColuna(cabecalho, "e-mail", "email"),
  whatsapp: acharColuna(cabecalho, "whatsapp", "telefone", "celular"),
  cidade: acharColuna(cabecalho, "cidade"),
  uf: acharColuna(cabecalho, "uf", "estado"),
  perfil: acharColuna(cabecalho, "perfil", "voce e", "tipo"),
};
if (col.email < 0 || col.nome < 0) {
  console.error("Não encontrei as colunas de nome e e-mail. Cabeçalho lido:", cabecalho.join(" | "));
  process.exit(1);
}

const vistos = new Set();
const membros = [];
for (const l of dados) {
  const email = (l[col.email] ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || vistos.has(email)) continue;
  vistos.add(email);
  membros.push({
    email,
    nome: (l[col.nome] ?? "").trim() || email.split("@")[0],
    whatsapp: col.whatsapp >= 0 ? (l[col.whatsapp] ?? "").replace(/\D/g, "") : "",
    perfis: col.perfil >= 0 ? perfisDe(l[col.perfil]) : [],
    ...cidadeUf(col.cidade >= 0 ? l[col.cidade] : "", col.uf >= 0 ? l[col.uf] : ""),
  });
}

console.log(`${membros.length} cadastros válidos encontrados em ${dados.length} linhas.`);
if (TESTE) {
  console.table(membros.slice(0, 20));
  console.log("Modo teste: nada foi gravado.");
  process.exit(0);
}

const admin = createClient(URL_SUPABASE, CHAVE, { auth: { persistSession: false, autoRefreshToken: false } });

// Usuários já existentes no Auth (para não duplicar).
const existentes = new Map();
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  for (const u of data.users) if (u.email) existentes.set(u.email.toLowerCase(), u.id);
  if (data.users.length < 1000) break;
}

let criados = 0, aprovados = 0, falhas = 0;
for (const m of membros) {
  const { email, ...meta } = m;
  const metadados = { ...meta, aceite: true };
  try {
    let id = existentes.get(email);
    if (!id) {
      const r = SEM_CONVITE
        ? await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: metadados })
        : await admin.auth.admin.inviteUserByEmail(email, { data: metadados, redirectTo: `${SITE}/inicio` });
      if (r.error) throw r.error;
      id = r.data.user.id;
      criados++;
    }
    const { error } = await admin.from("members").update({ status: "aprovado" }).eq("id", id);
    if (error) throw error;
    aprovados++;
    process.stdout.write(".");
  } catch (e) {
    falhas++;
    console.error(`\nFalha em ${email}: ${e.message ?? e}`);
  }
}

console.log(`\nPronto. ${criados} criados, ${aprovados} aprovados, ${falhas} falhas.`);
