import Image from "next/image";
import { iniciais } from "@/lib/formato";

const TAMANHOS = { sm: 32, md: 44, lg: 72, xl: 112 } as const;

export function Avatar({
  nome,
  url,
  tamanho = "md",
  className = "",
}: {
  nome: string;
  url: string | null;
  tamanho?: keyof typeof TAMANHOS;
  className?: string;
}) {
  const px = TAMANHOS[tamanho];
  if (url) {
    return (
      <Image
        src={url}
        alt={nome}
        width={px}
        height={px}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`marca inline-flex shrink-0 items-center justify-center rounded-full bg-azul text-white ${className}`}
      style={{ width: px, height: px, fontSize: px * 0.36 }}
    >
      {iniciais(nome)}
    </span>
  );
}
