import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Direita Conecta br",
    short_name: "Conecta br",
    description: "A rede de negócios de quem acredita no Brasil que trabalha.",
    start_url: "/inicio",
    display: "standalone",
    background_color: "#f7f5f0",
    theme_color: "#1247d8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
