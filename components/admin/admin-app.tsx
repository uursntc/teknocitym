"use client";

import { useState } from "react";
import { BrandMark } from "@/components/site/brand-mark";
import type { SiteContent } from "@/lib/content";
import type { ServiceRequest } from "@/lib/requests";
import { RequestsPanel } from "./requests-panel";
import { ContentEditor } from "./content-editor";

type Tab = "requests" | "content";

export function AdminApp({ initialContent, initialRequests }: { initialContent: SiteContent; initialRequests: ServiceRequest[] }) {
  const [tab, setTab] = useState<Tab>("requests");
  const [storeName, setStoreName] = useState(initialContent.store.name);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="admin">
      <header className="admin-top">
        <div className="wrap admin-top-row">
          <span className="brand">
            <BrandMark />
            <span className="brand-word">{storeName}</span>
            <small>Yönetim</small>
          </span>
          <div className="admin-tabs" role="tablist" aria-label="Panel bölümleri">
            <button role="tab" aria-selected={tab === "requests"} onClick={() => setTab("requests")}>
              Talepler
            </button>
            <button role="tab" aria-selected={tab === "content"} onClick={() => setTab("content")}>
              Site içeriği
            </button>
          </div>
          <div className="admin-links">
            <a className="btn btn-line btn-sm" href="/" target="_blank" rel="noopener noreferrer">
              Siteyi aç
            </a>
            <button className="btn btn-line btn-sm" type="button" onClick={logout}>
              Çıkış
            </button>
          </div>
        </div>
      </header>
      <main className="wrap admin-main">
        <div hidden={tab !== "requests"}>
          <RequestsPanel initial={initialRequests} storeName={storeName} />
        </div>
        <div hidden={tab !== "content"}>
          <ContentEditor initial={initialContent} onSaved={(c) => setStoreName(c.store.name)} active={tab === "content"} />
        </div>
      </main>
    </div>
  );
}
