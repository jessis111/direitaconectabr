import { Navegacao } from "@/components/Navegacao";
import { exigirMembro } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, membro } = await exigirMembro();

  const [{ count }] = await Promise.all([
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .neq("de_id", membro.id)
      .is("lida_em", null),
    supabase.rpc("registrar_acesso"),
  ]);

  return (
    <div className="min-h-dvh pb-24 md:pb-10">
      <Navegacao membro={membro} naoLidas={count ?? 0} />
      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">{children}</main>
    </div>
  );
}
