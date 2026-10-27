import type { OportunidadeStatus, Perfil } from "./types";

export const PERFIS: { valor: Perfil; rotulo: string; plural: string }[] = [
  { valor: "empresario", rotulo: "Empresário", plural: "Empresários" },
  { valor: "prestador", rotulo: "Prestador de serviço", plural: "Prestadores" },
  { valor: "profissional", rotulo: "Profissional", plural: "Profissionais" },
];

export const ROTULO_PERFIL: Record<Perfil, string> = {
  empresario: "Empresário",
  prestador: "Prestador",
  profissional: "Profissional",
};

export const STATUS_OPORTUNIDADE: Record<OportunidadeStatus, string> = {
  aberta: "Aberta",
  em_conversa: "Em conversa",
  fechada: "Fechada",
};

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export const SLUG_UGC = "ugc_creator";

export const NICHOS_PADRAO = [
  "Moda", "Beleza", "Casa e decoração", "Alimentação", "Fitness", "Tecnologia", "Finanças",
  "Família e infantil", "Pets", "Negócios", "Agro", "Automotivo", "Viagem", "Saúde",
];

export const FORMATOS_PADRAO = ["Vídeo falado", "Review", "Unboxing", "Foto", "Roteiro", "Edição"];

// Faixas de orçamento sugeridas no formulário (decisão em aberto no PRD).
export const FAIXAS_ORCAMENTO = [
  { rotulo: "Até R$ 1 mil", min: 0, max: 1000 },
  { rotulo: "R$ 1 mil a 5 mil", min: 1000, max: 5000 },
  { rotulo: "R$ 5 mil a 20 mil", min: 5000, max: 20000 },
  { rotulo: "Acima de R$ 20 mil", min: 20000, max: null },
];

export const LIMITE_SERVICOS = 5;
export const LIMITE_PROPOSTAS = 15;
export const LIMITE_CATEGORIAS = 5;
export const LIMITE_PORTFOLIO = 6;

export const GRUPO_WHATSAPP =
  process.env.NEXT_PUBLIC_GRUPO_WHATSAPP ?? "https://chat.whatsapp.com/IoQVYreiI5v8LToOQzilNF";
