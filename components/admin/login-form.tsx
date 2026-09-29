"use client";

import { useState } from "react";
import { BrandMark } from "@/components/site/brand-mark";

export function LoginForm({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error || "Giriş yapılamadı.");
    } catch {
      setError("Bağlantı kurulamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={submit}>
        <BrandMark />
        <h1>Yönetim paneli</h1>
        <p>Talepleri ve site içeriğini yönetmek için şifreni gir.</p>
        {!configured && (
          <div className="notice" style={{ marginBottom: 16 }}>
            Şifre henüz ayarlanmamış. Proje klasöründe <code>.env.local</code> dosyası oluşturup{" "}
            <code>ADMIN_PASSWORD=...</code> satırını ekle ve sunucuyu yeniden başlat.
          </div>
        )}
        <label className="a-field">
          <span className="a-label">Şifre</span>
          <input className="a-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        </label>
        {error && (
          <p className="f-err" role="alert" style={{ margin: "0 0 14px" }}>
            {error}
          </p>
        )}
        <button className="btn btn-solid btn-block" type="submit" disabled={loading || !password}>
          {loading ? "Giriş yapılıyor" : "Giriş yap"}
        </button>
      </form>
    </main>
  );
}
