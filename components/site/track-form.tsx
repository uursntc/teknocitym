"use client";

import { useState } from "react";
import { TRACK_FLOW, type Status } from "@/lib/requests";
import { formatDate } from "@/lib/utils";

type Result = { ticketNo: string; device: string; status: Status; updatedAt: string; history: { status: Status; at: string }[] };

export function TrackForm() {
  const [no, setNo] = useState("");
  const [tel, setTel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!no.trim() || tel.replace(/\D/g, "").length !== 4) {
      setError("Fiş numarasını ve telefonunun son 4 hanesini yaz.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/track?no=${encodeURIComponent(no.trim())}&tel=${encodeURIComponent(tel)}`);
      const data = (await res.json()) as Result & { error?: string };
      if (!res.ok) setError(data.error || "Sorgu yapılamadı.");
      else setResult(data);
    } catch {
      setError("Bağlantı kurulamadı. Biraz sonra tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  const reachedIndex = result ? TRACK_FLOW.indexOf(result.status) : -1;

  return (
    <div>
      <form className="track-form" onSubmit={submit} noValidate>
        <label className="f-field" style={{ margin: 0 }}>
          <span className="f-label">Fiş numarası</span>
          <input className="f-input" placeholder="TC-260928-1234" value={no} onChange={(e) => setNo(e.target.value)} autoComplete="off" />
        </label>
        <label className="f-field" style={{ margin: 0 }}>
          <span className="f-label">Telefonun son 4 hanesi</span>
          <input className="f-input" inputMode="numeric" maxLength={4} placeholder="4567" value={tel} onChange={(e) => setTel(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-solid" disabled={loading}>
          {loading ? "Sorgulanıyor" : "Sorgula"}
        </button>
      </form>
      <div className="track-result" aria-live="polite">
        {error && <div className="track-msg">{error}</div>}
        {result && (
          <div className="track-card">
            <h3>{result.status}</h3>
            <p className="meta">
              {result.ticketNo}
              {result.device ? `, ${result.device}` : ""}. Son güncelleme {formatDate(result.updatedAt)}
            </p>
            {result.status === "İptal" ? (
              <div className="track-msg">Bu talep iptal edildi. Soruların için mağazayla iletişime geçebilirsin.</div>
            ) : (
              <ol className="timeline">
                {TRACK_FLOW.map((s, i) => (
                  <li key={s} className={i < reachedIndex ? "done" : i === reachedIndex ? "now" : ""}>
                    {s}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
