const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function formatarValor(v: number | null | undefined) {
  return v == null ? null : moeda.format(Number(v));
}

export function formatarFaixa(min: number | null, max: number | null) {
  if (min == null && max == null) return null;
  if (min != null && max != null) return min === max ? formatarValor(min) : `${formatarValor(min)} a ${formatarValor(max)}`;
  if (min != null) return `A partir de ${formatarValor(min)}`;
  return `Até ${formatarValor(max)}`;
}

export function tempoRelativo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  const dias = Math.floor(diff / 86400);
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function local(cidade: string | null, uf: string | null) {
  return [cidade, uf].filter(Boolean).join(", ") || null;
}

export function soDigitos(v: string) {
  return v.replace(/\D/g, "");
}

// Normaliza para o formato internacional usado no wa.me (55 + DDD + número).
export function telefoneInternacional(v: string) {
  const d = soDigitos(v);
  if (!d) return "";
  return d.startsWith("55") && d.length >= 12 ? d : `55${d}`;
}

export function linkWhatsApp(numero: string, mensagem?: string) {
  const base = `https://wa.me/${telefoneInternacional(numero)}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

export function formatarTelefone(v: string) {
  const d = soDigitos(v).replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v;
}

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

export function linkExterno(v: string | null) {
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export function linkInstagram(v: string | null) {
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://instagram.com/${v.replace(/^@/, "")}`;
}

export function linkTiktok(v: string | null) {
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://tiktok.com/@${v.replace(/^@/, "")}`;
}

export function numeroOuNulo(v: FormDataEntryValue | null) {
  if (v == null) return null;
  // Aceita "1.500", "1500" e "1500,50" (formato brasileiro).
  const s = String(v).replace(/[^\d,]/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function textoOuNulo(v: FormDataEntryValue | null) {
  const s = v == null ? "" : String(v).trim();
  return s ? s : null;
}
