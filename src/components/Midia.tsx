import type { ItemPortfolio } from "@/lib/types";

// Mostra um item de portfólio: vídeo enviado, imagem ou link externo.
export function Midia({ item, className = "" }: { item: ItemPortfolio; className?: string }) {
  if (item.tipo === "video")
    return <video src={item.url} poster={item.capa_url ?? undefined} controls playsInline preload="metadata" className={`bg-tinta object-cover ${className}`} />;
  if (item.tipo === "imagem")
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.url} alt="" loading="lazy" className={`object-cover ${className}`} />;
  let host = item.url;
  try {
    host = new URL(item.url).hostname.replace(/^www\./, "");
  } catch {}
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className={`flex flex-col justify-end bg-degrade p-4 text-sm font-semibold ${className}`}>
      <span className="text-white/70">Ver em</span>
      <span>{host}</span>
    </a>
  );
}
