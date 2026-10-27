import type { Metadata } from "next";
import { FormEntrar } from "./FormEntrar";

export const metadata: Metadata = { title: "Entrar" };

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ volta?: string; erro?: string }> }) {
  const { volta, erro } = await searchParams;
  return <FormEntrar volta={volta && volta.startsWith("/") && !volta.startsWith("//") ? volta : "/inicio"} erroLink={!!erro} />;
}
