export type MemberStatus = "pendente" | "aprovado" | "bloqueado";
export type Perfil = "empresario" | "prestador" | "profissional";
export type OportunidadeTipo = "geral" | "campanha_ugc";
export type OportunidadeStatus = "aberta" | "em_conversa" | "fechada";

// Colunas de members que a API devolve para membros (sem e-mail, WhatsApp e telefone).
export const COLUNAS_MEMBRO =
  "id, nome, cidade, uf, perfis, titulo, bio, foto_url, instagram, site, categorias, oferece_servicos, status, is_admin, onboarding_em, criado_em, perfil_completo";

export const COLUNAS_AUTOR = "id, nome, foto_url, titulo, cidade, uf";

export interface Membro {
  id: string;
  nome: string;
  cidade: string | null;
  uf: string | null;
  perfis: Perfil[];
  titulo: string | null;
  bio: string | null;
  foto_url: string | null;
  instagram: string | null;
  site: string | null;
  categorias: string[];
  oferece_servicos: boolean;
  status: MemberStatus;
  is_admin: boolean;
  onboarding_em: string | null;
  criado_em: string;
  perfil_completo: boolean;
}

export type Autor = Pick<Membro, "id" | "nome" | "foto_url" | "titulo" | "cidade" | "uf">;

export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  ordem: number;
  ativa: boolean;
  campos_extras: { nichos?: string[]; formatos?: string[] } | null;
}

export interface ItemPortfolio {
  url: string;
  tipo: "video" | "imagem" | "link";
  capa_url?: string | null;
}

export interface Servico {
  id: string;
  membro_id: string;
  categoria_id: string;
  nome: string;
  descricao: string | null;
  preco_min: number | null;
  preco_max: number | null;
  ativo: boolean;
  nichos: string[];
  formatos: string[];
  remoto: boolean | null;
  tiktok: string | null;
  portfolio: ItemPortfolio[];
  criado_em: string;
}

export interface Oportunidade {
  id: string;
  autor_id: string;
  tipo: OportunidadeTipo;
  titulo: string;
  descricao: string;
  categoria_id: string;
  cidade: string | null;
  uf: string | null;
  remoto: boolean;
  orcamento_min: number | null;
  orcamento_max: number | null;
  prazo: string | null;
  entregas: number | null;
  status: OportunidadeStatus;
  fechada_com_id: string | null;
  num_propostas: number;
  criado_em: string;
}

export interface Proposta {
  id: string;
  oportunidade_id: string | null;
  servico_id: string | null;
  de_id: string;
  para_id: string;
  mensagem: string;
  valor: number | null;
  prazo: string | null;
  criado_em: string;
  lida_em: string | null;
}

export interface Conversa {
  id: string;
  proposta_id: string;
  membro_a_id: string;
  membro_b_id: string;
  ultima_msg_em: string | null;
  criado_em: string;
}

export interface Mensagem {
  id: string;
  conversa_id: string;
  de_id: string;
  texto: string | null;
  imagem_url: string | null;
  criado_em: string;
  lida_em: string | null;
}

// Selects com o autor embutido; !inner esconde conteúdo de membros bloqueados.
export const SELECT_OPORTUNIDADE = `*, autor:members!opportunities_autor_id_fkey!inner(${COLUNAS_AUTOR})`;
export const SELECT_SERVICO = `*, membro:members!services_membro_id_fkey!inner(${COLUNAS_AUTOR})`;
