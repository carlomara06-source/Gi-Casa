import Link from "next/link";
import { Logo } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function WelcomePage() {
  return (
    <div className="min-h-dvh bg-bg pt-[54px]">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <Logo />
        <span className="rounded-full bg-blue-100 px-2 py-1.5 font-label text-[9px] font-semibold tracking-[0.14em] text-blue-700">
          MILANO E DINTORNI
        </span>
      </div>

      <div className="mx-4 mt-3.5 rounded-[18px] bg-linear-to-b from-[#143049] to-accent-900 px-4.5 py-5.5 text-white">
        <div className="mb-3.5 font-label text-[9.5px] font-semibold tracking-[0.2em] text-sun">
          BENVENUTO SU GIÀCASA
        </div>
        <h1 className="mb-2.5 font-display text-[38px] leading-[1.06]">Che cosa ti porta qui?</h1>
        <p className="text-sm leading-relaxed text-blue-200">
          Due strade, nessun giro di parole. Da qui in poi ti diciamo sempre qual è il passo
          successivo, e quanto costa prima che tu lo chieda.
        </p>
      </div>

      <div className="flex flex-col gap-3.5 px-4 pt-4">
        <Card className="p-4.5">
          <div className="mb-2.5 font-label text-[9px] font-semibold tracking-[0.16em] text-accent-600">
            SE VUOI COMPRARE
          </div>
          <div className="mb-3.5 font-display text-[29px] leading-[1.08]">Cerco casa a Milano</div>
          <div className="mb-4 flex flex-col gap-2.5">
            {[
              "Cerchi e vedi subito quanto ti costa: tariffa fissa, mai una percentuale.",
              "Visiti con un agente di zona, senza dare il tuo numero al venditore.",
              "Proposta, trattativa e rogito: ti accompagniamo fino alle chiavi.",
            ].map((t, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="w-4 flex-none font-display text-xl leading-none text-blue-400">{i + 1}</span>
                <span className="text-[13px] leading-normal text-neutral-800">{t}</span>
              </div>
            ))}
          </div>
          <div className="mb-3.5 rounded-xl bg-sun-200 p-3 text-[12.5px] leading-snug text-sun-700">
            Da <strong className="font-bold">1.990 €</strong> a proposta accettata. Su una casa da
            189.000 € l&apos;agenzia tradizionale ne chiederebbe 6.920 €.
          </div>
          <Link href="/ricerca">
            <Button variant="accent" className="w-full">Inizia a cercare</Button>
          </Link>
        </Card>

        <Card className="p-4.5">
          <div className="mb-2.5 font-label text-[9px] font-semibold tracking-[0.16em] text-blue-700">
            SE VUOI VENDERE
          </div>
          <div className="mb-3.5 font-display text-[29px] leading-[1.08]">Vendo senza provvigioni</div>
          <div className="mb-4 flex flex-col gap-2.5">
            {[
              "Valutazione gratuita in due minuti, con i prezzi reali della tua via.",
              "Pubblichi gratis: visura, planimetria e APE li verifichiamo noi.",
              "Un agente gestisce visite e proposte; il prezzo resta una tua decisione.",
            ].map((t, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="w-4 flex-none font-display text-xl leading-none text-blue-400">{i + 1}</span>
                <span className="text-[13px] leading-normal text-neutral-800">{t}</span>
              </div>
            ))}
          </div>
          <div className="mb-3.5 rounded-xl bg-blue-100 p-3 text-[12.5px] leading-snug text-blue-700">
            <strong className="font-bold">0% di provvigione, sempre.</strong> Gli abbonamenti
            settimanali sono facoltativi: servono solo se vuoi più visibilità.
          </div>
          <Link href="/valutazione">
            <Button variant="navy" className="w-full">Valuta la mia casa</Button>
          </Link>
        </Card>
      </div>

      <div className="mx-4 mt-4.5 mb-8 flex gap-3 rounded-2xl border border-dashed border-neutral-300 p-4">
        <div className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-blue-200 font-semibold text-blue-800">
          M
        </div>
        <div className="min-w-0">
          <div className="font-heading text-base font-semibold">Non sai ancora da che parte stare?</div>
          <div className="mt-1 text-[12.5px] leading-snug text-neutral-700">
            Martina è la referente Giàcasa per Milano nord. Risponde in chat dalle 9 alle 20, anche
            solo per una domanda.
          </div>
          <Link href="/chat" className="mt-3 inline-block">
            <Button variant="outline">Parla con una persona</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
