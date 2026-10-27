import { Marca } from "@/components/Marca";
import { LANDING_URL } from "@/lib/constantes";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-degrade min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-5 py-6 sm:px-8">
        <Marca className="text-xl" href={LANDING_URL} />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 text-tinta shadow-[0_30px_80px_-30px_rgba(5,13,42,0.6)] sm:p-9">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
