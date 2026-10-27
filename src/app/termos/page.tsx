import type { Metadata } from "next";
import { Marca } from "@/components/Marca";

export const metadata: Metadata = { title: "Princípios e privacidade" };

export default function TermosPage() {
  return (
    <main>
      <header className="bg-degrade">
        <div className="mx-auto max-w-3xl px-5 pb-14 pt-6 sm:px-8">
          <Marca className="text-xl" />
          <h1 className="mt-12 text-4xl font-bold tracking-tight">Princípios e privacidade</h1>
          <p className="mt-3 text-white/80">O que você aceita ao entrar na rede.</p>
        </div>
      </header>
      <article className="mx-auto max-w-3xl space-y-10 px-5 py-14 text-[1.0625rem] leading-relaxed text-cinza-escuro sm:px-8">
        <section>
          <h2 className="mb-3 text-xl font-bold text-tinta">Nossos princípios</h2>
          <p>
            A Direita Conecta br é a rede de negócios de quem acredita no Brasil que trabalha. Reunimos empresários,
            prestadores de serviço e profissionais de direita que querem fazer o dinheiro girar entre quem pensa igual.
          </p>
          <p className="mt-3">Quem entra compartilha cinco valores: livre iniciativa, trabalho, família, propriedade e Brasil.</p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-bold text-tinta">Conduta na rede</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>A rede é para negócios: comprar, vender, contratar, fechar parceria e indicar.</li>
            <li>Respeito nas conversas. Sem ofensas, golpes, spam ou propaganda de partido e candidato.</li>
            <li>Publique só o que você pode entregar. Combine valores, prazos e condições por escrito.</li>
            <li>Conteúdo ou membro que fuja dos princípios pode ser removido sem aviso.</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-bold text-tinta">A plataforma conecta, não intermedeia</h2>
          <p>
            A plataforma aproxima os membros e oferece um chat para a primeira conversa. Pagamentos, contratos e entregas
            são combinados diretamente entre as partes, que respondem pelo negócio fechado. Desconfie de pedidos de
            pagamento antecipado fora do combinado e denuncie qualquer abuso.
          </p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-bold text-tinta">Privacidade e LGPD</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Coletamos nome, WhatsApp, e-mail, cidade, perfil e as informações que você colocar no seu perfil.</li>
            <li>Os dados servem para operar a rede: aprovar cadastros, mostrar seu perfil a outros membros aprovados e enviar avisos.</li>
            <li>Seu WhatsApp e telefone nunca são públicos. Só aparecem para um membro depois que vocês abrem uma conversa.</li>
            <li>Não vendemos nem compartilhamos seus dados com terceiros fora dos serviços que fazem a plataforma funcionar.</li>
            <li>Você pode pedir a correção ou a exclusão dos seus dados a qualquer momento pelo Instagram @direitaconectabr.</li>
          </ul>
        </section>
      </article>
    </main>
  );
}
