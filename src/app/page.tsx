import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Marca } from "@/components/Marca";
import { sessaoAtual } from "@/lib/auth";

const FOTO_HERO = "/img/hero.jpg";
const temFoto = fs.existsSync(path.join(process.cwd(), "public", FOTO_HERO));

const PASSOS = [
  { n: "01", titulo: "Faça seu cadastro", texto: "Nome, WhatsApp, cidade e o que você faz. A gente aprova e libera o acesso." },
  { n: "02", titulo: "Publique ou encontre", texto: "Diga o que você precisa ou mostre o serviço que você oferece." },
  { n: "03", titulo: "Feche negócio", texto: "Converse no app e, quando decidir, ligue ou chame no WhatsApp." },
];

export default async function Home() {
  const { user, membro } = await sessaoAtual();
  if (user) redirect(membro?.status === "aprovado" ? "/inicio" : "/aguardando");

  return (
    <main>
      <section className="bg-degrade min-h-[92dvh]">
        <div className="mx-auto flex max-w-6xl flex-col px-5 pb-16 pt-6 sm:px-8">
          <header className="flex items-center justify-between">
            <Marca className="text-xl sm:text-2xl" href={null} />
            <Link href="/entrar" className="btn btn-claro btn-pequeno">
              Entrar
            </Link>
          </header>

          <div className="mt-14 grid items-center gap-12 lg:mt-20 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-medium text-white/80">Rede de negócios · Cadastro aberto</p>
              <h1 className="mt-5 text-[2.6rem] font-bold leading-[1.05] tracking-tight sm:text-6xl">
                A rede de negócios de quem acredita no Brasil que trabalha.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-white/85">
                Empresários, prestadores e profissionais de direita comprando, vendendo, contratando e indicando entre si.
                Faça negócio com quem pensa como você.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/cadastro" className="btn btn-primario">
                  Quero me cadastrar
                </Link>
                <Link href="/entrar" className="btn btn-claro">
                  Já sou membro
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-2 text-sm font-semibold">
                <span className="rounded-full bg-white px-3.5 py-1.5 text-tinta">Empresários</span>
                <span className="rounded-full bg-amarelo px-3.5 py-1.5 text-amarelo-tinta">Prestadores</span>
                <span className="rounded-full bg-verde-vivo px-3.5 py-1.5 text-white">Profissionais</span>
              </div>
            </div>

            {temFoto ? (
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px]">
                <Image src={FOTO_HERO} alt="Empresário no seu local de trabalho" fill priority className="object-cover" sizes="(min-width: 1024px) 40vw, 100vw" />
              </div>
            ) : (
              <div className="hidden aspect-[4/5] items-end rounded-[28px] bg-white/8 p-10 ring-1 ring-white/15 lg:flex">
                <p className="marca text-[7rem] leading-none">
                  DC<span className="font-medium text-amarelo">br</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <p className="text-sm font-semibold text-azul">Como funciona</p>
        <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Negócio com os nossos, em três passos.</h2>
        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {PASSOS.map((p, i) => (
            <div key={p.n}>
              <p className={`marca text-7xl leading-none ${["text-azul", "text-amarelo", "text-verde"][i]}`}>{p.n}</p>
              <p className="mt-4 text-xl font-bold">{p.titulo}</p>
              <p className="mt-2 text-cinza">{p.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-fechamento">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-5 py-20 text-center sm:px-8">
          <Marca className="text-4xl sm:text-6xl" href={null} />
          <p className="mt-5 max-w-md text-lg text-white/80">Livre iniciativa, trabalho, família, propriedade e Brasil.</p>
          <Link href="/cadastro" className="btn btn-primario mt-8">
            Fazer meu cadastro
          </Link>
          <p className="mt-6 text-sm text-white/60">@direitaconectabr</p>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-cinza sm:px-8">
        <Marca className="text-base text-tinta" href={null} />
        <div className="flex gap-5">
          <Link href="/termos">Princípios e privacidade</Link>
          <a href="https://instagram.com/direitaconectabr" target="_blank" rel="noreferrer">
            Instagram
          </a>
        </div>
      </footer>
    </main>
  );
}
