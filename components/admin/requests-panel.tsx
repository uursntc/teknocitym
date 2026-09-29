"use client";

import { useMemo, useState } from "react";
import { STATUSES, type ServiceRequest, type Status } from "@/lib/requests";
import { formatDate, telLink, toWhatsAppNumber, waLink } from "@/lib/utils";

export function RequestsPanel({ initial, storeName }: { initial: ServiceRequest[]; storeName: string }) {
  const [items, setItems] = useState<ServiceRequest[]>(initial);
  const [filter, setFilter] = useState<Status | "Aktif" | "Tümü">("Aktif");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(""), 2200);
  };

  const counts = useMemo(() => {
    const m: Record<string, number> = { Tümü: items.length, Aktif: 0 };
    for (const r of items) {
      m[r.status] = (m[r.status] || 0) + 1;
      if (r.status !== "Teslim edildi" && r.status !== "İptal") m.Aktif += 1;
    }
    return m;
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return items.filter((r) => {
      if (filter === "Aktif" && (r.status === "Teslim edildi" || r.status === "İptal")) return false;
      if (filter !== "Aktif" && filter !== "Tümü" && r.status !== filter) return false;
      if (!q) return true;
      return [r.ticketNo, r.name, r.phone, r.device, r.model, r.note].join(" ").toLocaleLowerCase("tr").includes(q);
    });
  }, [items, filter, query]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/requests", { cache: "no-store" });
      if (res.ok) setItems((await res.json()) as ServiceRequest[]);
      else flash("Liste yenilenemedi.");
    } finally {
      setLoading(false);
    }
  }

  async function patch(id: string, body: { status?: Status; internalNote?: string }, message: string) {
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return flash("Kaydedilemedi. Oturumun kapanmış olabilir.");
    const updated = (await res.json()) as ServiceRequest;
    setItems((cur) => cur.map((r) => (r.id === id ? updated : r)));
    flash(message);
  }

  async function remove(r: ServiceRequest) {
    if (!window.confirm(`${r.ticketNo} numaralı talep silinsin mi? Bu işlem geri alınamaz.`)) return;
    const res = await fetch(`/api/requests/${r.id}`, { method: "DELETE" });
    if (!res.ok) return flash("Silinemedi.");
    setItems((cur) => cur.filter((x) => x.id !== r.id));
    flash("Talep silindi");
  }

  const filters: (Status | "Aktif" | "Tümü")[] = ["Aktif", ...STATUSES, "Tümü"];

  return (
    <section>
      <div className="admin-h">
        <div>
          <h1>Talepler</h1>
          <p>Sitedeki servis fişinden gelen tamir, satın alma ve takas talepleri.</p>
        </div>
        <button className="btn btn-line btn-sm" type="button" onClick={refresh} disabled={loading}>
          {loading ? "Yenileniyor" : "Yenile"}
        </button>
      </div>

      <div className="admin-toolbar">
        <input className="admin-search" type="search" placeholder="Fiş no, isim, telefon veya cihaz ara" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="filter-chips" style={{ marginBottom: 18 }}>
        {filters.map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f}
            <small>{counts[f] || 0}</small>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          {items.length === 0
            ? "Henüz talep yok. Sitedeki servis fişi gönderildiğinde burada görünecek."
            : "Bu filtreyle eşleşen talep yok."}
        </div>
      ) : (
        <div className="req-list">
          {visible.map((r) => {
            const isOpen = open === r.id;
            const msg = `Merhaba ${r.name}, ${r.ticketNo} numaralı servis fişinizin durumu: ${r.status}. ${storeName}`;
            return (
              <article key={r.id} className={`req${isOpen ? " open" : ""}`}>
                <button type="button" className="req-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : r.id)}>
                  <span className="req-no">
                    {r.ticketNo}
                    <small>{formatDate(r.createdAt)}</small>
                  </span>
                  <span className="req-name">
                    {r.name}
                    <small>{r.phone}</small>
                  </span>
                  <span className="req-dev">
                    {r.type}
                    <small>{[r.device, r.model].filter(Boolean).join(" ")}</small>
                  </span>
                  <span className="badge" data-s={r.status}>
                    {r.status}
                  </span>
                  <span className="req-chev" aria-hidden="true" />
                </button>
                {isOpen && (
                  <div className="req-body">
                    <dl className="req-grid">
                      <div>
                        <dt>Talep türü</dt>
                        <dd>{r.type}</dd>
                      </div>
                      <div>
                        <dt>Cihaz</dt>
                        <dd>{[r.device, r.model].filter(Boolean).join(" ") || "Belirtilmedi"}</dd>
                      </div>
                      <div>
                        <dt>Sorun</dt>
                        <dd>{r.issues.length ? r.issues.join(", ") : "Belirtilmedi"}</dd>
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <dt>Müşteri notu</dt>
                        <dd>{r.note || "Not yok"}</dd>
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <dt>Durum geçmişi</dt>
                        <dd>{(r.history || []).map((h) => `${h.status} (${formatDate(h.at)})`).join(", ")}</dd>
                      </div>
                    </dl>
                    <label className="a-field">
                      <span className="a-label">İç not (müşteri görmez)</span>
                      <textarea
                        className="a-input"
                        defaultValue={r.internalNote}
                        placeholder="Fiyat teklifi, parça bilgisi, arıza ayrıntısı"
                        onBlur={(e) => {
                          if (e.target.value !== r.internalNote) patch(r.id, { internalNote: e.target.value }, "Not kaydedildi");
                        }}
                      />
                    </label>
                    <div className="req-actions">
                      <label className="sr-only" htmlFor={`st-${r.id}`}>
                        Durum
                      </label>
                      <select
                        id={`st-${r.id}`}
                        className="status-select"
                        value={r.status}
                        onChange={(e) => patch(r.id, { status: e.target.value as Status }, "Durum güncellendi")}
                      >
                        {STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                      <a className="btn btn-solid btn-sm" href={waLink(toWhatsAppNumber(r.phone), msg)} target="_blank" rel="noopener noreferrer">
                        Müşteriye durumu yaz
                      </a>
                      <a className="btn btn-line btn-sm" href={telLink(r.phone)}>
                        Ara
                      </a>
                      <button type="button" className="btn btn-line btn-sm" style={{ marginLeft: "auto" }} onClick={() => remove(r)}>
                        Sil
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </section>
  );
}
