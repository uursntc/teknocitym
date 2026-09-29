"use client";

import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/site/photo";
import { ADMIN_SCHEMA, getAt, setAt, type FieldDef, type ItemField } from "@/lib/admin-schema";
import type { SiteContent } from "@/lib/content";

type Row = Record<string, string>;

export function ContentEditor({
  initial,
  onSaved,
  active,
}: {
  initial: SiteContent;
  onSaved: (c: SiteContent) => void;
  active: boolean;
}) {
  const [content, setContent] = useState<SiteContent>(initial);
  const [saved, setSaved] = useState<string>(JSON.stringify(initial));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const dirty = JSON.stringify(content) !== saved;

  // Kaydedilmemiş değişiklik varken sayfadan çıkılırsa uyar
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (path: string, value: unknown) => setContent((c) => setAt(c, path, value));

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(data.error || "Kaydedilemedi.");
        return;
      }
      const next = (await res.json()) as SiteContent;
      setContent(next);
      setSaved(JSON.stringify(next));
      onSaved(next);
      setMessage("Kaydedildi. Değişiklikler sitede yayında.");
    } catch {
      setMessage("Bağlantı kurulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="admin-h">
        <div>
          <h1>Site içeriği</h1>
          <p>Metinleri ve fotoğrafları değiştir, en alttaki çubuktan kaydet.</p>
        </div>
      </div>

      {ADMIN_SCHEMA.map((section) => (
        <div className="a-card" key={section.id} id={`sec-${section.id}`}>
          <h2>{section.title}</h2>
          {section.description ? <p>{section.description}</p> : <p />}
          {section.fields.map((f) => (
            <Field key={f.path} def={f} value={getAt(content, f.path)} onChange={(v) => update(f.path, v)} />
          ))}
        </div>
      ))}

      {active && (
        <div className="savebar">
          <div className="wrap">
            <p aria-live="polite">{message || (dirty ? "Kaydedilmemiş değişiklikler var." : "Tüm değişiklikler kayıtlı.")}</p>
            <div className="btn-row">
              <button
                type="button"
                className="btn btn-line btn-sm"
                disabled={!dirty || saving}
                onClick={() => {
                  setContent(JSON.parse(saved) as SiteContent);
                  setMessage("Değişiklikler geri alındı.");
                }}
              >
                Geri al
              </button>
              <button type="button" className="btn btn-solid btn-sm" disabled={!dirty || saving} onClick={save}>
                {saving ? "Kaydediliyor" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  if (def.kind === "text" || def.kind === "textarea") {
    return (
      <label className="a-field">
        <span className="a-label">{def.label}</span>
        {def.kind === "text" ? (
          <input className="a-input" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <textarea className="a-input" rows={3} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        )}
        {def.hint && <span className="a-hint">{def.hint}</span>}
      </label>
    );
  }

  if (def.kind === "strings") {
    const list = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="a-field">
        <span className="a-label">{def.label}</span>
        <div className="a-list">
          {list.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <input
                className="a-input"
                value={item}
                aria-label={`${def.label} ${i + 1}`}
                onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))}
              />
              <Tools
                index={i}
                length={list.length}
                onMove={(to) => onChange(move(list, i, to))}
                onRemove={() => onChange(list.filter((_, j) => j !== i))}
              />
            </div>
          ))}
        </div>
        <div>
          <button type="button" className="btn btn-line btn-sm" onClick={() => onChange([...list, ""])}>
            Madde ekle
          </button>
        </div>
      </div>
    );
  }

  // list
  const rows = Array.isArray(value) ? (value as Row[]) : [];
  const blank = (): Row => Object.fromEntries(def.item.map((f) => [f.key, ""]));
  return (
    <div className="a-field">
      <span className="a-label">{def.label}</span>
      {def.hint && <span className="a-hint">{def.hint}</span>}
      <div className="a-list">
        {rows.map((row, i) => (
          <div className="a-item" key={i}>
            <div className="a-item-head">
              <span>
                {def.itemLabel} {i + 1}
              </span>
              {!def.fixed && (
                <Tools
                  index={i}
                  length={rows.length}
                  onMove={(to) => onChange(move(rows, i, to))}
                  onRemove={() => {
                    if (window.confirm(`${def.itemLabel} ${i + 1} silinsin mi?`)) onChange(rows.filter((_, j) => j !== i));
                  }}
                />
              )}
            </div>
            {def.item.map((f) => (
              <ItemInput
                key={f.key}
                field={f}
                value={row[f.key] ?? ""}
                onChange={(v) => onChange(rows.map((r, j) => (j === i ? { ...r, [f.key]: v } : r)))}
              />
            ))}
          </div>
        ))}
      </div>
      {!def.fixed && (
        <div>
          <button type="button" className="btn btn-line btn-sm" onClick={() => onChange([...rows, blank()])}>
            {def.itemLabel} ekle
          </button>
        </div>
      )}
    </div>
  );
}

function ItemInput({ field, value, onChange }: { field: ItemField; value: string; onChange: (v: string) => void }) {
  if (field.kind === "photo") return <PhotoInput label={field.label} value={value} onChange={onChange} />;
  return (
    <label className="a-field">
      <span className="a-label">{field.label}</span>
      {field.kind === "text" ? (
        <input className="a-input" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <textarea className="a-input" rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function PhotoInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) setError(data.error || "Yüklenemedi.");
      else onChange(data.url);
    } catch {
      setError("Bağlantı kurulamadı.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="a-field">
      <span className="a-label">{label}</span>
      <div className="a-photo">
        <Photo key={value} src={value} alt="Fotoğraf yok" />
        <div className="a-photo-tools">
          <input className="a-input" value={value} placeholder="https://… ya da yükle" onChange={(e) => onChange(e.target.value)} aria-label={`${label} adresi`} />
          <div className="row">
            <button type="button" className="btn btn-solid btn-sm" disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? "Yükleniyor" : "Bilgisayardan yükle"}
            </button>
            {value && (
              <button type="button" className="btn btn-line btn-sm" onClick={() => onChange("")}>
                Kaldır
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
          <span className="a-hint">JPG, PNG veya WEBP, en fazla 8 MB. Yatay ve en az 1600 piksel genişlikte fotoğraf en iyi sonucu verir.</span>
          {error && <span className="f-err">{error}</span>}
        </div>
      </div>
    </div>
  );
}

function Tools({ index, length, onMove, onRemove }: { index: number; length: number; onMove: (to: number) => void; onRemove: () => void }) {
  return (
    <span className="a-item-tools">
      <button type="button" className="icon-btn" aria-label="Yukarı taşı" disabled={index === 0} onClick={() => onMove(index - 1)}>
        ↑
      </button>
      <button type="button" className="icon-btn" aria-label="Aşağı taşı" disabled={index === length - 1} onClick={() => onMove(index + 1)}>
        ↓
      </button>
      <button type="button" className="icon-btn" aria-label="Sil" onClick={onRemove}>
        ×
      </button>
    </span>
  );
}

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}
