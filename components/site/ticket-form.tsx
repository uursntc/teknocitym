"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BrandMark } from "./brand-mark";
import type { TicketPreset } from "./preset-link";
import { DEVICES, ISSUES, REQUEST_TYPES, type RequestType } from "@/lib/requests";
import { telLink, waLink } from "@/lib/utils";

const TYPE_TEXT: Record<RequestType, { note: string; ph: string; model: string }> = {
  Tamir: { note: "Kısaca anlat", ph: "Ne zaman başladı, cihaz düştü mü ya da sıvı temas etti mi?", model: "ör. iPhone 13 Pro" },
  "Satın alma": { note: "Ne arıyorsun?", ph: "Model, renk, hafıza ve bütçe", model: "ör. MacBook Air M3" },
  Takas: { note: "Cihazının durumu", ph: "Hafıza, pil sağlığı, çizik ya da kırık var mı, kutusu duruyor mu?", model: "ör. iPhone 12, 128 GB" },
};

type Errors = Partial<Record<"device" | "name" | "phone" | "consent" | "form", string>>;

export function TicketForm({
  storeName,
  whatsapp,
  phoneDisplay,
  phoneTel,
  address,
  kvkk,
}: {
  storeName: string;
  whatsapp: string;
  phoneDisplay: string;
  phoneTel: string;
  address: string;
  kvkk: string;
}) {
  const [type, setType] = useState<RequestType>("Tamir");
  const [device, setDevice] = useState("");
  const [model, setModel] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [ticketNo, setTicketNo] = useState<string | null>(null);
  const [today, setToday] = useState("");
  const deviceRef = useRef<HTMLSelectElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const [printRoot, setPrintRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPrintRoot(document.getElementById("print-root"));
  }, []);

  useEffect(() => {
    setToday(new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }));
    const onPreset = (e: Event) => {
      const d = (e as CustomEvent<TicketPreset>).detail || {};
      if (d.type && (REQUEST_TYPES as readonly string[]).includes(d.type)) setType(d.type as RequestType);
      if (d.device !== undefined) setDevice(d.device);
      setIssues(d.issue ? [d.issue] : []);
      setTicketNo(null);
    };
    window.addEventListener("ticket:preset", onPreset);
    return () => window.removeEventListener("ticket:preset", onPreset);
  }, []);

  const text = TYPE_TEXT[type];

  const summary = useMemo(() => {
    const lines = [`Merhaba, servis fişi ${ticketNo ?? ""}`.trim(), `Talep: ${type}`];
    if (device || model) lines.push(`Cihaz: ${[device, model].filter(Boolean).join(" ")}`);
    if (type === "Tamir" && issues.length) lines.push(`Sorun: ${issues.join(", ")}`);
    if (note.trim()) lines.push(`Not: ${note.trim()}`);
    if (name.trim()) lines.push(`Ad: ${name.trim()}`);
    return lines.join("\n");
  }, [ticketNo, type, device, model, issues, note, name]);

  const toggleIssue = (i: string) => setIssues((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (!device) next.device = "Cihaz türünü seç.";
    if (!name.trim()) next.name = "Adını yaz; fişi bu isimle açalım.";
    if (phone.replace(/\D/g, "").length < 10) next.phone = "Telefon numaranı eksiksiz yaz.";
    if (!consent) next.consent = "Devam etmek için onay kutusunu işaretle.";
    setErrors(next);
    if (next.device) return deviceRef.current?.focus();
    if (next.name) return nameRef.current?.focus();
    if (next.phone) return phoneRef.current?.focus();
    if (next.consent) return;

    setSending(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, device, model, issues, note, name, phone, consent, website }),
      });
      const data = (await res.json()) as { ticketNo?: string; error?: string; errors?: Errors };
      if (!res.ok || !data.ticketNo) {
        setErrors({ ...(data.errors || {}), form: data.error || "Talep gönderilemedi. WhatsApp'tan yazabilirsin." });
        return;
      }
      setTicketNo(data.ticketNo);
    } catch {
      setErrors({ form: "Bağlantı kurulamadı. Tekrar dene ya da WhatsApp'tan yaz." });
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setTicketNo(null);
    setDevice("");
    setModel("");
    setIssues([]);
    setNote("");
    setConsent(false);
    setErrors({});
  }

  const head = (
    <div className="ticket-head">
      <div className="ticket-brand">
        <BrandMark />
        <div>
          <strong>{storeName}</strong>
          <span>Servis fişi</span>
        </div>
      </div>
      <dl className="ticket-meta">
        <div>
          <dt>Fiş no</dt>
          <dd>{ticketNo ?? "Gönderince oluşur"}</dd>
        </div>
        <div>
          <dt>Tarih</dt>
          <dd>{today}</dd>
        </div>
      </dl>
    </div>
  );

  if (ticketNo) {
    return (
      <>
        <div className="ticket" role="status">
          {head}
          <div className="ticket-done">
            <div className="ring">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </div>
            <h3>Talebin alındı</h3>
            <p>Fiş numaranı sakla; cihazının durumunu bununla sorgulayabilirsin. En kısa sürede seni arayacağız.</p>
            <div className="no">{ticketNo}</div>
            <div className="btn-row" style={{ justifyContent: "center" }}>
              <a className="btn btn-solid" href={waLink(whatsapp, summary)} target="_blank" rel="noopener noreferrer">
                WhatsApp&apos;tan da gönder
              </a>
              <button type="button" className="btn btn-line" style={{ color: "#0A0A0A", borderColor: "#CFCFCC" }} onClick={() => window.print()}>
                Yazdır
              </button>
              <button type="button" className="btn btn-line" style={{ color: "#0A0A0A", borderColor: "#CFCFCC" }} onClick={reset}>
                Yeni talep
              </button>
            </div>
          </div>
        </div>
        {printRoot &&
          createPortal(
            <PrintSlip
              no={ticketNo}
              today={today}
              storeName={storeName}
              type={type}
              device={device}
              model={model}
              issues={issues}
              note={note}
              name={name}
              phone={phone}
              phoneDisplay={phoneDisplay}
              address={address}
            />,
            printRoot,
          )}
      </>
    );
  }

  return (
    <form className="ticket" onSubmit={submit} noValidate aria-label="Servis fişi">
      {head}

      <fieldset className="f-field">
        <legend className="f-label">Talep türü</legend>
        <div className="seg">
          {REQUEST_TYPES.map((t) => (
            <label key={t}>
              <input type="radio" name="ttype" value={t} checked={type === t} onChange={() => setType(t)} />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="f-row">
        <label className="f-field">
          <span className="f-label">Cihaz</span>
          <span className="select-wrap">
            <select
              ref={deviceRef}
              className="f-input"
              value={device}
              aria-invalid={!!errors.device}
              aria-describedby="err-device"
              onChange={(e) => {
                setDevice(e.target.value);
                setErrors((x) => ({ ...x, device: undefined }));
              }}
            >
              <option value="">Seç</option>
              {DEVICES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </span>
          <em className="f-err" id="err-device">{errors.device}</em>
        </label>
        <label className="f-field">
          <span className="f-label">Model</span>
          <input className="f-input" value={model} onChange={(e) => setModel(e.target.value)} placeholder={text.model} autoComplete="off" />
        </label>
      </div>

      <fieldset className="f-field" hidden={type !== "Tamir"}>
        <legend className="f-label">Sorun</legend>
        <div className="chips">
          {ISSUES.map((i) => (
            <button key={i} type="button" className="chip" aria-pressed={issues.includes(i)} onClick={() => toggleIssue(i)}>
              {i}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="f-field">
        <span className="f-label">{text.note}</span>
        <textarea className="f-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={text.ph} />
      </label>

      <div className="f-row">
        <label className="f-field">
          <span className="f-label">Ad soyad</span>
          <input
            ref={nameRef}
            className="f-input"
            value={name}
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby="err-name"
            onChange={(e) => {
              setName(e.target.value);
              setErrors((x) => ({ ...x, name: undefined }));
            }}
          />
          <em className="f-err" id="err-name">{errors.name}</em>
        </label>
        <label className="f-field">
          <span className="f-label">Telefon</span>
          <input
            ref={phoneRef}
            className="f-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="05XX XXX XX XX"
            value={phone}
            aria-invalid={!!errors.phone}
            aria-describedby="err-phone"
            onChange={(e) => {
              setPhone(e.target.value);
              setErrors((x) => ({ ...x, phone: undefined }));
            }}
          />
          <em className="f-err" id="err-phone">{errors.phone}</em>
        </label>
      </div>

      <div className="hp" aria-hidden="true">
        <label>
          Web sitesi
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <label className="consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            setErrors((x) => ({ ...x, consent: undefined }));
          }}
        />
        <span>Kişisel verilerimin bu talep için işlenmesini kabul ediyorum.</span>
      </label>
      <details className="kvkk">
        <summary>KVKK aydınlatma metni</summary>
        <p>{kvkk}</p>
      </details>
      <em className="f-err" style={{ display: errors.consent ? "block" : undefined, marginBottom: 12 }}>{errors.consent}</em>

      <div className="ticket-total">
        <span>Arıza tespiti</span>
        <span className="leader" aria-hidden="true" />
        <strong>Ücretsiz</strong>
      </div>

      <button type="submit" className="btn btn-solid btn-block" disabled={sending}>
        {sending ? "Gönderiliyor" : "Talebi gönder"}
      </button>
      <p className="ticket-status" role="alert">{errors.form}</p>
      <p className="ticket-foot">
        Aramayı tercih edersen: <a href={telLink(phoneTel)}>{phoneDisplay}</a>
      </p>
    </form>
  );
}

/**
 * Yazdırılabilir servis fişi. Ekranda görünmez; yalnızca yazdırma önizlemesinde
 * (window.print) sayfanın geri kalanının yerine gösterilir (bkz. globals.css'teki
 * @media print kuralı). Fiş onaylandığında mağazanın müşteriye elden verebileceği
 * kağıt kopyayı sağlar.
 */
function PrintSlip({
  no,
  today,
  storeName,
  type,
  device,
  model,
  issues,
  note,
  name,
  phone,
  phoneDisplay,
  address,
}: {
  no: string;
  today: string;
  storeName: string;
  type: RequestType;
  device: string;
  model: string;
  issues: string[];
  note: string;
  name: string;
  phone: string;
  phoneDisplay: string;
  address: string;
}) {
  return (
    <div className="print-slip" aria-hidden="true">
      <div className="ps-head">
        <div className="ps-brand">
          <BrandMark />
          <div>
            <strong>{storeName}</strong>
            <span>Servis Fişi</span>
          </div>
        </div>
        <div className="ps-meta">
          <div>
            Fiş no
            <b>{no}</b>
          </div>
          <div>
            Tarih
            <b>{today}</b>
          </div>
        </div>
      </div>
      <table className="ps-table">
        <tbody>
          <tr>
            <th>Müşteri</th>
            <td>{name}</td>
          </tr>
          <tr>
            <th>Telefon</th>
            <td>{phone}</td>
          </tr>
          <tr>
            <th>Talep türü</th>
            <td>{type}</td>
          </tr>
          <tr>
            <th>Cihaz</th>
            <td>{[device, model].filter(Boolean).join(" ") || "—"}</td>
          </tr>
          {type === "Tamir" && (
            <tr>
              <th>Sorun</th>
              <td>{issues.length ? issues.join(", ") : "—"}</td>
            </tr>
          )}
          <tr>
            <th>Not</th>
            <td>{note || "—"}</td>
          </tr>
          <tr>
            <th>Durum</th>
            <td>Alındı</td>
          </tr>
        </tbody>
      </table>
      <p className="ps-note">
        Arıza tespiti ücretsizdir. Fiyat onaylanmadan hiçbir onarım işlemi yapılmaz. Bu fiş, cihazın teslim alındığına dair
        belgedir; teslim sırasında ibraz edilmesi rica olunur.
      </p>
      <div className="ps-sign">
        <div>Müşteri imzası</div>
        <div>Yetkili imzası</div>
      </div>
      <p className="ps-foot">
        {phoneDisplay}
        {address ? ` · ${address}` : ""}
      </p>
    </div>
  );
}
