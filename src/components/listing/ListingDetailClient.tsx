"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { TopBar } from "@/components/TopBar";
import { Placeholder } from "@/components/ui/Placeholder";
import { Button } from "@/components/ui/Button";
import type { BookingDay } from "@/lib/dates";

type Listing = {
  id: string;
  title: string;
  city: string;
  zone: string;
  price: number;
  priceLabel: string;
  feeLabel: string;
  agencyLabel: string;
  pricePerMqLabel: string;
  mq: number;
  locali: number;
  bagni: number;
  piano: number;
  hasLift: boolean;
  classeEnergetica: string;
  description: string;
  ownerName: string;
  documents: { id: string; name: string; meta: string }[];
};

const SLOT_TIMES = ["09:30", "10:00", "11:00", "15:00", "17:30", "18:30"];

export function ListingDetailClient({
  listing,
  agent,
  isUnlocked,
  existingVisit,
  appointmentFeeLabel,
  loggedIn,
  bookedSlots,
  days,
  initialSaved,
}: {
  listing: Listing;
  agent: { name: string; zone: string; rating: number } | null;
  isUnlocked: boolean;
  existingVisit: { id: string; scheduledAt: string; status: string } | null;
  appointmentFeeLabel: string;
  loggedIn: boolean;
  bookedSlots: string[];
  days: BookingDay[];
  initialSaved: boolean;
}) {
  const router = useRouter();
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [otpStage, setOtpStage] = useState<"none" | "phone" | "code">("none");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState("");
  const [otpId, setOtpId] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [pendingBook, setPendingBook] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(Boolean(existingVisit));
  const [chatBusy, setChatBusy] = useState(false);
  const [saved, setSaved] = useState(initialSaved);
  const [saveBusy, setSaveBusy] = useState(false);

  async function toggleSaved() {
    if (!loggedIn) {
      router.push(`/accesso?callbackUrl=/annunci/${listing.id}`);
      return;
    }
    setSaveBusy(true);
    const next = !saved;
    setSaved(next);
    try {
      await fetch(`/api/saved/${listing.id}`, { method: next ? "POST" : "DELETE" });
    } finally {
      setSaveBusy(false);
    }
  }

  async function startChat() {
    if (!loggedIn) {
      router.push(`/accesso?callbackUrl=/annunci/${listing.id}`);
      return;
    }
    setChatBusy(true);
    try {
      const res = await fetch("/api/chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, kind: "BUYER_SELLER" }),
      });
      const data = await res.json();
      if (res.ok) router.push(`/chat/${data.thread.id}`);
    } finally {
      setChatBusy(false);
    }
  }

  const slotDateTime = (day: BookingDay, time: string) => {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(day.iso);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const isBusy = (time: string) => {
    const dt = slotDateTime(days[dayIdx], time);
    return bookedSlots.some((b) => new Date(b).getTime() === dt.getTime());
  };

  async function sendCode() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "FOGLIO_VISITA" }),
      });
      const data = await res.json();
      setOtpId(data.otpId);
      setDevHint(data.mode === "dev" ? `Demo: il codice è ${data.devCode}` : null);
      setOtpStage("code");
    } catch {
      setError("Non siamo riusciti a inviare il codice. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (!otpId) return;
    setError(null);
    setBusy(true);
    try {
      const result = await signIn("otp", {
        otpId,
        code,
        listingId: listing.id,
        redirect: false,
      });
      if (result?.error) {
        setError("Codice non valido. Controlla e riprova.");
        setBusy(false);
        return;
      }
      setOtpStage("none");
      if (pendingBook && slot) {
        await confirmBooking();
      } else {
        router.refresh();
      }
    } catch {
      setError("Qualcosa è andato storto. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmBooking() {
    if (!slot) return;
    setBusy(true);
    setError(null);
    try {
      const scheduledAt = slotDateTime(days[dayIdx], slot).toISOString();
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, scheduledAt }),
      });
      if (!res.ok) throw new Error();
      setBooked(true);
      setPendingBook(false);
      router.refresh();
    } catch {
      setError("Non siamo riusciti a confermare la visita. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  function onUnlockClick() {
    setPendingBook(false);
    setOtpStage("phone");
  }

  function onBookClick() {
    if (!slot) return;
    if (loggedIn && isUnlocked) {
      confirmBooking();
    } else {
      setPendingBook(true);
      setOtpStage("phone");
    }
  }

  const canSend = phone.replace(/\D/g, "").length >= 9 && consent;

  return (
    <div className="min-h-dvh bg-bg pb-40">
      <TopBar />

      <div className="relative h-[288px]">
        <Placeholder label="foto · soggiorno con balcone" className="h-full w-full" />
        <button
          onClick={toggleSaved}
          disabled={saveBusy}
          aria-label={saved ? "Rimuovi dai salvati" : "Salva annuncio"}
          className="absolute top-2.5 right-3 flex h-8 w-8 items-center justify-center bg-blue-900 text-white"
        >
          {saved ? "♥" : "♡"}
        </button>
        <div className="absolute right-0 bottom-0 flex items-baseline gap-2 bg-accent-600 px-3.5 py-2 text-white">
          <span className="font-label text-[9px] font-semibold tracking-[0.13em] opacity-85">FLAT FEE</span>
          <span className="font-display text-[26px] leading-none">{listing.feeLabel}</span>
        </div>
      </div>

      <div className="px-4 pt-4.5">
        <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.13em] text-blue-700">
          {listing.city.toUpperCase()} · {listing.zone.toUpperCase()} · VERIFICATO DA NOI
        </div>
        <h2 className="mb-1.5 font-display text-[30px] leading-[1.12] tracking-[-0.018em]">{listing.title}</h2>
        <div className="mb-4 flex flex-wrap items-baseline gap-2.5">
          <div className="font-display text-[32px] leading-none">{listing.priceLabel}</div>
          <div className="flex-none bg-sun-200 px-1.75 py-1.5 font-label text-[10px] font-semibold tracking-[0.09em] whitespace-nowrap text-sun-700">
            {listing.pricePerMqLabel} €/M²
          </div>
        </div>

        <div className="mb-4.5 grid grid-cols-3 gap-px border border-divider bg-divider">
          {[
            { k: "SUPERFICIE", v: `${listing.mq} m²` },
            { k: "LOCALI", v: String(listing.locali) },
            { k: "BAGNI", v: String(listing.bagni) },
            { k: "PIANO", v: String(listing.piano) },
            { k: "ASCENSORE", v: listing.hasLift ? "Sì" : "No" },
            { k: "CLASSE", v: listing.classeEnergetica },
          ].map((f) => (
            <div key={f.k} className="bg-bg p-2.75">
              <div className="mb-1.5 font-label text-[8.5px] font-semibold tracking-[0.1em] text-neutral-600">{f.k}</div>
              <div className="font-display text-[19px] leading-none">{f.v}</div>
            </div>
          ))}
        </div>

        <p className="mb-4.5 text-[13.5px] leading-relaxed text-neutral-800">{listing.description}</p>

        <div className="mb-5 flex items-center gap-2.75 border-t border-b border-divider py-3.25">
          <div className="flex h-9.5 w-9.5 flex-none items-center justify-center rounded-full bg-blue-200 font-semibold text-blue-800">
            {listing.ownerName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-heading text-base font-semibold">{listing.ownerName}, proprietario</div>
            <div className="mt-0.75 text-[11.5px] text-neutral-600">Chat anonima, senza numeri</div>
          </div>
          <button
            onClick={startChat}
            disabled={chatBusy}
            className="flex-none border border-blue-600 px-2.75 py-2.25 font-label text-[11px] font-semibold tracking-[0.09em] text-blue-700 hover:bg-blue-100"
          >
            SCRIVI
          </button>
        </div>

        <div className="mb-3 flex items-baseline justify-between gap-2.5">
          <h3 className="font-display text-2xl">Trasparenza</h3>
          <div
            className={`flex-none px-2 py-1.5 font-label text-[9px] font-semibold tracking-[0.11em] ${
              isUnlocked ? "bg-blue-600 text-white" : "bg-neutral-200 text-neutral-700"
            }`}
          >
            {isUnlocked ? "SBLOCCATA" : "BLOCCATA"}
          </div>
        </div>

        {isUnlocked ? (
          <div className="border border-blue-600 bg-blue-100 p-3.5">
            {listing.documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 border-b border-blue-200 py-2.75 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="font-heading text-base font-semibold">{d.name}</div>
                  <div className="mt-0.5 text-[11.5px] text-blue-700">{d.meta}</div>
                </div>
                <div className="flex-none font-label text-[10px] font-semibold tracking-[0.1em] text-blue-700">APRI</div>
              </div>
            ))}
            <div className="mt-2.5 font-label text-[9.5px] font-semibold tracking-[0.09em] text-blue-700">
              FOGLIO DI VISITA FIRMATO CON OTP · IL TUO NUMERO NON È VISIBILE AL VENDITORE.
            </div>
            <Link
              href={`/annunci/${listing.id}/proposta`}
              className="mt-3 block bg-accent-900 py-3 text-center font-heading text-[13px] font-bold tracking-[0.06em] text-white uppercase hover:bg-blue-800"
            >
              Fai una proposta d&apos;acquisto
            </Link>
          </div>
        ) : (
          <div className="relative overflow-hidden border border-divider">
            <div className="pointer-events-none p-3.5 opacity-55 blur-[6px]">
              {listing.documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 border-b border-divider py-2.75 last:border-0">
                  <div>
                    <div className="font-heading text-base font-semibold">{d.name}</div>
                    <div className="mt-0.5 text-[11.5px] text-neutral-600">{d.meta}</div>
                  </div>
                  <div className="font-label text-[10px] font-semibold text-blue-700">APRI</div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-5 py-5 text-center" style={{ background: "color-mix(in srgb, var(--color-bg) 62%, transparent)" }}>
              <div className="mb-3 font-display max-w-[250px] text-[23px] leading-tight">
                Planimetria, visura e APE si sbloccano con un codice SMS
              </div>
              <div className="mb-3.5 max-w-[260px] text-xs leading-snug text-neutral-700">
                L&apos;OTP firma il Foglio di Visita: vale come tua firma legale e ci permette di
                mostrarti i documenti.
              </div>
              <Button variant="outline" onClick={onUnlockClick}>Sblocca con OTP</Button>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pt-6">
        <h3 className="mb-1 font-display text-2xl">Scegli quando visitare</h3>
        <p className="mb-3.5 text-[12.5px] text-neutral-700">
          {agent ? `Ti accompagna ${agent.name}, agente abilitato della zona.` : "Ti accompagna un agente abilitato della zona."}
        </p>
        <div className="mb-3.5 flex gap-1.75 overflow-x-auto pb-1">
          {days.map((d, i) => (
            <div
              key={i}
              onClick={() => {
                setDayIdx(i);
                setSlot(null);
              }}
              className={`flex-none cursor-pointer border px-3.25 py-2.5 text-center ${
                dayIdx === i ? "border-accent-900 bg-accent-900 text-white" : "border-divider bg-surface"
              }`}
            >
              <div className="font-label text-[8.5px] font-semibold tracking-[0.1em] opacity-70">{d.dow}</div>
              <div className="mt-1.25 font-display text-[23px] leading-none">{d.dayNum}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.75">
          {SLOT_TIMES.map((t) => {
            const busySlot = isBusy(t);
            const sel = slot === t;
            return (
              <div
                key={t}
                onClick={() => !busySlot && setSlot(t)}
                className={`py-2.75 text-center font-heading text-[15px] font-semibold ${
                  busySlot
                    ? "cursor-default border border-divider bg-neutral-200 text-neutral-400 line-through"
                    : sel
                      ? "cursor-pointer border border-accent-600 bg-accent-600 text-white"
                      : "cursor-pointer border border-divider bg-surface"
                }`}
              >
                {t}
              </div>
            );
          })}
        </div>
        <div className={`mt-3 text-xs leading-snug ${slot ? "font-semibold text-blue-700" : "text-neutral-600"}`}>
          {booked
            ? "Visita confermata."
            : slot
              ? `Visita ${days[dayIdx].long} alle ${slot} · confermi con l'OTP, senza anticipi.`
              : "Gli orari barrati sono già prenotati da altri acquirenti."}
        </div>
      </div>

      {error && <div className="mx-4 mt-3 text-xs text-accent-700">{error}</div>}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-divider bg-bg px-4 pt-3 pb-6.5">
        <div className="mb-2.75 flex items-end justify-between gap-3 pb-2.75">
          <div>
            <div className="mb-1.25 font-label text-[9px] font-semibold tracking-[0.11em] text-neutral-600">
              COSTO AGENZIA
            </div>
            <div className="font-display text-[25px] leading-[0.9] text-neutral-600 line-through">{listing.agencyLabel}</div>
          </div>
          <div className="w-px self-stretch bg-divider" />
          <div className="text-right">
            <div className="mb-1.25 font-label text-[9px] font-semibold tracking-[0.11em] text-accent-700">
              NOSTRA TARIFFA
            </div>
            <div className="font-display text-[25px] leading-[0.9] text-accent-700">{listing.feeLabel}</div>
          </div>
        </div>
        <div className="mb-2.75 flex items-center justify-between gap-2.5 border-l-3 border-blue-600 bg-blue-100 px-2.75 py-2.25">
          <div className="text-[11.5px] leading-snug text-neutral-800">
            Quota visita <strong className="font-semibold">{appointmentFeeLabel}</strong>, scomputata dalla tariffa se compri
          </div>
          <div className="flex-none font-label text-[9px] font-semibold tracking-[0.09em] text-blue-700">AGENTE INCLUSO</div>
        </div>
        <Button
          className="w-full"
          disabled={booked || (!slot && !booked) || busy}
          onClick={onBookClick}
        >
          {booked ? "Visita prenotata" : busy ? "Un attimo…" : slot ? `Prenota visita · ${days[dayIdx].long} ${slot}` : "Prenota visita"}
        </Button>
      </div>

      {otpStage !== "none" && (
        <div className="fixed inset-0 z-60 flex items-end bg-accent-900/46" onClick={() => setOtpStage("none")}>
          <div className="w-full bg-bg px-4 pt-5 pb-8.5" onClick={(e) => e.stopPropagation()}>
            {otpStage === "phone" ? (
              <>
                <h2 className="mb-2 font-display text-2xl">Sblocca planimetria e visura</h2>
                <p className="mb-4 text-[13px] leading-snug text-neutral-700">
                  Ti mandiamo un codice via SMS. Serve a entrare senza password e firmare il Foglio
                  di Visita, che vale come tua firma legale.
                </p>
                <div className="mb-2 font-label text-[9.5px] font-semibold tracking-[0.12em] text-neutral-600">
                  NUMERO DI TELEFONO
                </div>
                <div className="blueprint mb-4 flex items-center bg-surface">
                  <div className="border-r border-divider px-3 font-display text-xl text-neutral-700">+39</div>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9 ]/g, "").slice(0, 13))}
                    placeholder="333 000 0000"
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 font-display text-2xl outline-none"
                  />
                </div>
                <div onClick={() => setConsent((c) => !c)} className="mb-5 flex cursor-pointer items-start gap-2.5">
                  <div className={`mt-0.5 h-4.5 w-4.5 flex-none border-[1.5px] ${consent ? "border-accent-600 bg-accent-600" : "border-neutral-400"}`} />
                  <div className="text-xs leading-snug text-neutral-700">
                    Accetto che il codice OTP valga come firma del Foglio di Visita e ho letto
                    l&apos;informativa privacy.
                  </div>
                </div>
                <Button className="w-full" disabled={!canSend || busy} onClick={sendCode}>
                  {busy ? "Invio…" : "Invia codice SMS"}
                </Button>
              </>
            ) : (
              <>
                <h2 className="mb-2 font-display text-2xl">Inserisci il codice</h2>
                <p className="mb-4 text-[13.5px] leading-snug text-neutral-700">
                  Sei cifre inviate al +39 {phone || "333 000 0000"}.
                </p>
                {devHint && <p className="mb-3 text-xs font-semibold text-blue-700">{devHint}</p>}
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="······"
                  className="blueprint mb-4 w-full bg-surface px-3 py-3 text-center font-display text-2xl tracking-[0.4em] outline-none"
                />
                <Button className="w-full" disabled={code.length !== 6 || busy} onClick={verifyCode}>
                  {busy ? "Verifico…" : "Firma e sblocca"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
