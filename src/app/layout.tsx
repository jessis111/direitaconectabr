import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-outfit" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Direita Conecta br", template: "%s · Direita Conecta br" },
  description:
    "A rede de negócios de quem acredita no Brasil que trabalha. Empresários, prestadores e profissionais de direita fazendo negócio entre si.",
  applicationName: "Direita Conecta br",
  openGraph: { siteName: "Direita Conecta br", locale: "pt_BR", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#1247d8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${jakarta.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
