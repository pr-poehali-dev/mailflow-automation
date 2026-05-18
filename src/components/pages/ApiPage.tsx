import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { ApiKey, ApiEvent, Trigger, BASE_URL } from "./api/endpoints";
import ApiKeysTab from "./api/ApiKeysTab";
import ApiDocsTab from "./api/ApiDocsTab";
import ApiLogTab from "./api/ApiLogTab";
import ApiTriggersTab from "./api/ApiTriggersTab";

export function ApiPage() {
  const [tab, setTab] = useState<"keys" | "docs" | "log" | "triggers">("keys");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadKeys = async () => {
    const r = await fetch(`${BASE_URL}?resource=keys`);
    const d = await r.json();
    setKeys(d.keys || []);
  };

  const loadEvents = async () => {
    const r = await fetch(`${BASE_URL}?resource=events`);
    const d = await r.json();
    setEvents(d.events || []);
  };

  const loadTriggers = async () => {
    const r = await fetch(`${BASE_URL}?resource=triggers`);
    const d = await r.json();
    setTriggers(d.triggers || []);
  };

  useEffect(() => {
    loadKeys();
    loadEvents();
    loadTriggers();
  }, []);

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tabs = [
    { id: "keys", label: "Ключи доступа", icon: "Key" },
    { id: "docs", label: "Документация", icon: "BookOpen" },
    { id: "log", label: "Журнал событий", icon: "Activity" },
    { id: "triggers", label: "Триггеры", icon: "Zap" },
  ] as const;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="fade-in-up flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Программный интерфейс MAIL-KA</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Интеграция с вашими системами по протоколу REST</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono-custom"
          style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
          Интерфейс доступен
        </div>
      </div>

      {/* Base URL */}
      <div className="glass rounded-2xl p-4 flex items-center gap-3">
        <div className="text-xs text-muted-foreground flex-shrink-0">Base URL</div>
        <code className="font-mono-custom text-xs flex-1 truncate" style={{ color: "#06b6d4" }}>{BASE_URL}</code>
        <button onClick={() => handleCopy(BASE_URL, -1)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
          <Icon name={copiedId === -1 ? "Check" : "Copy"} size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); if (t.id === "log") loadEvents(); if (t.id === "triggers") loadTriggers(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
            style={tab === t.id ? { background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.15))" } : {}}>
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "keys" && (
        <ApiKeysTab keys={keys} reload={loadKeys} copiedId={copiedId} onCopy={handleCopy} />
      )}
      {tab === "docs" && (
        <ApiDocsTab copiedId={copiedId} onCopy={handleCopy} />
      )}
      {tab === "log" && (
        <ApiLogTab events={events} reload={loadEvents} />
      )}
      {tab === "triggers" && (
        <ApiTriggersTab triggers={triggers} />
      )}
    </div>
  );
}
