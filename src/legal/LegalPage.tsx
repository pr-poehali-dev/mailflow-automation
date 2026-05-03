import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import OfferDoc from "./docs/OfferDoc";
import PrivacyDoc from "./docs/PrivacyDoc";
import CookieDoc from "./docs/CookieDoc";
import ConsentDoc from "./docs/ConsentDoc";

type DocKey = "offer" | "privacy" | "cookie" | "consent";

const DOCS: { key: DocKey; title: string; icon: string; pathTail: string }[] = [
  { key: "offer", title: "Договор-оферта", icon: "FileSignature", pathTail: "offer" },
  { key: "privacy", title: "Политика обработки персональных данных", icon: "ShieldCheck", pathTail: "privacy" },
  { key: "consent", title: "Согласие на обработку ПДн", icon: "FileCheck", pathTail: "consent" },
  { key: "cookie", title: "Политика использования Cookie", icon: "Cookie", pathTail: "cookie" },
];

function detectDoc(): DocKey {
  const path = window.location.pathname.toLowerCase();
  if (path.includes("/legal/offer")) return "offer";
  if (path.includes("/legal/privacy")) return "privacy";
  if (path.includes("/legal/consent")) return "consent";
  if (path.includes("/legal/cookie")) return "cookie";
  return "offer";
}

export default function LegalPage() {
  const [doc, setDoc] = useState<DocKey>(detectDoc());

  useEffect(() => {
    document.title = `${DOCS.find((d) => d.key === doc)?.title} — MAIL-KA`;
  }, [doc]);

  const navigate = (key: DocKey) => {
    setDoc(key);
    window.history.pushState({}, "", `/legal/${key}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2.5 text-sm font-bold gradient-text">
            <Icon name="Zap" size={16} />
            MAIL-KA
          </a>
          <a href="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
            <Icon name="ArrowLeft" size={12} /> Вернуться на сайт
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 grid md:grid-cols-[220px_1fr] gap-6">
        <aside className="space-y-1">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2">
            Документы
          </h2>
          {DOCS.map((d) => (
            <button
              key={d.key}
              onClick={() => navigate(d.key)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-all"
              style={{
                background: doc === d.key ? "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.06))" : "transparent",
                color: doc === d.key ? "#7c3aed" : "var(--foreground)",
                fontWeight: doc === d.key ? 600 : 400,
              }}
            >
              <Icon name={d.icon} size={14} />
              <span className="text-xs">{d.title}</span>
            </button>
          ))}
          <div className="mt-4 p-3 rounded-xl border border-border text-[11px] leading-relaxed text-muted-foreground">
            <div className="font-semibold text-foreground mb-1">ООО «МАТ-Лабс»</div>
            <div>ИНН 6312223437</div>
            <div className="mt-1">hello@mail-ka.ru</div>
            <div>abuse@mail-ka.ru</div>
          </div>
        </aside>

        <main className="prose prose-sm max-w-none">
          <article className="bg-card rounded-2xl border border-border p-7">
            {doc === "offer" && <OfferDoc />}
            {doc === "privacy" && <PrivacyDoc />}
            {doc === "consent" && <ConsentDoc />}
            {doc === "cookie" && <CookieDoc />}
          </article>
        </main>
      </div>
    </div>
  );
}
