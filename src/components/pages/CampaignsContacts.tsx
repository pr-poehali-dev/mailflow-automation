import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { StatusBadge } from "@/components/shared";
import {
  fetchCampaigns, createCampaign, updateCampaign, deleteCampaign,
  fetchContacts, createContact, deleteContact, importContacts,
  Campaign, Contact,
} from "@/api";

// ─── Campaigns ────────────────────────────────────────────────────────────────

export function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchCampaigns();
    setCampaigns(data.campaigns);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = campaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await createCampaign({ name: newName, subject: newSubject, status: "draft" });
    setNewName("");
    setNewSubject("");
    setShowForm(false);
    setSaving(false);
    load();
  };

  const handleStatusChange = async (id: number, status: string) => {
    await updateCampaign(id, { status });
    load();
  };

  const handleDelete = async (id: number) => {
    await deleteCampaign(id);
    load();
  };

  const fmtDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="fade-in-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Кампании</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            {loading ? "Загрузка..." : `${campaigns.length} кампаний · Email-рассылки, триггеры, A/B-тесты`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white w-full sm:w-auto"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
          <Icon name="Plus" size={15} />
          Создать кампанию
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="glass rounded-2xl p-4 space-y-3 fade-in-up">
          <div className="text-sm font-semibold">Новая кампания</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Название *</label>
              <input
                className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors"
                placeholder="Например: Летняя распродажа"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Тема письма</label>
              <input
                className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors"
                placeholder="Заголовок письма"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving || !newName.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              {saving ? "Создаём..." : "Создать черновик"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm glass hover:bg-white/8 transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl flex-1 max-w-xs">
          <Icon name="Search" size={15} className="text-muted-foreground" />
          <input
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
            placeholder="Поиск кампаний..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {["Все", "Активные", "Черновики"].map((f) => (
          <button key={f} className="px-3 py-1.5 rounded-xl text-xs font-medium glass hover:bg-white/8 transition-colors">
            {f}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
            <Icon name="Loader2" size={16} className="animate-spin" />
            Загружаем кампании...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Icon name="Mail" size={32} className="opacity-30" />
            <div className="text-sm">Кампаний пока нет</div>
            <button onClick={() => setShowForm(true)} className="text-xs px-3 py-1.5 rounded-xl font-medium" style={{ background: "rgba(139,92,246,0.2)", color: "#8b5cf6" }}>
              Создать первую
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                <th className="text-left px-5 py-3">Кампания</th>
                <th className="text-left px-5 py-3">Статус</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Отправлено</th>
                <th className="text-left px-5 py-3">Открываемость</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">Кликабельность</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Дата</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-white/3 transition-colors group">
                  <td className="px-5 py-3.5 font-medium">{c.name}</td>
                  <td className="px-5 py-3.5">
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      className="bg-transparent border-none outline-none text-xs cursor-pointer"
                    >
                      {["draft", "active", "paused", "sent"].map((s) => (
                        <option key={s} value={s} className="bg-background">{s}</option>
                      ))}
                    </select>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-5 py-3.5 font-mono-custom text-muted-foreground hidden md:table-cell">{c.sent_count.toLocaleString()}</td>
                  <td className="px-5 py-3.5 font-mono-custom">{c.open_rate > 0 ? `${c.open_rate}%` : "—"}</td>
                  <td className="px-5 py-3.5 font-mono-custom text-muted-foreground hidden lg:table-cell">{c.click_rate > 0 ? `${c.click_rate}%` : "—"}</td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{fmtDate(c.sent_at || c.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400">
                      <Icon name="Trash2" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newSegment, setNewSegment] = useState("Новый");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const data = await fetchContacts();
    setContacts(data.contacts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const segmentCounts = (seg: string) => contacts.filter((c) => seg === "Все" ? true : c.segment === seg).length;

  const segments = [
    { label: "Все", color: "#8b5cf6" },
    { label: "VIP", color: "#fb923c" },
    { label: "Активный", color: "#4ade80" },
    { label: "Спящий", color: "#94a3b8" },
    { label: "Новый", color: "#06b6d4" },
  ];

  const [activeSegment, setActiveSegment] = useState("Все");

  const filtered = contacts.filter((c) => {
    const matchSeg = activeSegment === "Все" || c.segment === activeSegment;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    return matchSeg && matchSearch;
  });

  const handleCreate = async () => {
    if (!newEmail.trim()) return;
    setSaving(true);
    setError("");
    const res = await createContact({ name: newName, email: newEmail, segment: newSegment });
    setSaving(false);
    if (res.error) { setError(res.error === "email already exists" ? "Этот email уже существует" : res.error); return; }
    setNewName(""); setNewEmail(""); setNewSegment("Новый");
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: number) => {
    await deleteContact(id);
    load();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);
    const rows = lines.slice(1).map((line) => {
      const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
      return { name: parts[0] || "", email: parts[1] || "", segment: parts[2] || "Новый" };
    }).filter((r) => r.email);
    if (!rows.length) { setImportMsg("Файл пустой или неверный формат"); return; }
    const res = await importContacts(rows);
    setImportMsg(`Импортировано ${res.inserted} из ${rows.length} контактов`);
    load();
    setTimeout(() => setImportMsg(""), 4000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="fade-in-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Контакты</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            {loading ? "Загрузка..." : `${contacts.length} контактов · 5 сегментов`}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass hover:bg-white/8 transition-colors">
            <Icon name="Upload" size={15} />
            <span className="hidden sm:inline">Импорт CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
            <Icon name="UserPlus" size={15} />
            Добавить
          </button>
        </div>
      </div>

      {importMsg && (
        <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80" }}>
          {importMsg}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="glass rounded-2xl p-4 space-y-3 fade-in-up">
          <div className="text-sm font-semibold">Новый контакт</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Имя</label>
              <input className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors"
                placeholder="Иван Иванов" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Email *</label>
              <input className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors"
                placeholder="ivan@example.ru" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Сегмент</label>
              <select className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors"
                value={newSegment} onChange={(e) => setNewSegment(e.target.value)}>
                {["Новый", "VIP", "Активный", "Спящий"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {error && <div className="text-xs text-red-400">{error}</div>}
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving || !newEmail.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              {saving ? "Добавляем..." : "Добавить"}
            </button>
            <button onClick={() => { setShowForm(false); setError(""); }} className="px-4 py-2 rounded-xl text-sm glass hover:bg-white/8 transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Segments */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {segments.map((s) => (
          <div key={s.label}
            onClick={() => setActiveSegment(s.label)}
            className={`glass rounded-2xl p-4 cursor-pointer transition-all ${activeSegment === s.label ? "ring-1" : "hover:bg-white/5"}`}
            style={activeSegment === s.label ? { ringColor: s.color } : {}}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{segmentCounts(s.label).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl max-w-xs">
        <Icon name="Search" size={15} className="text-muted-foreground" />
        <input className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
          placeholder="Поиск по имени или email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-2xl p-4" style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.2)" }}>
        <div className="flex items-center gap-3">
          <Icon name="Brain" size={18} style={{ color: "#06b6d4" }} />
          <div>
            <span className="font-medium text-sm">Поведенческая сегментация</span>
            <span className="text-xs text-muted-foreground ml-2">Автоматически делит аудиторию по активности, кликам и покупкам</span>
          </div>
          <button className="ml-auto text-xs px-3 py-1.5 rounded-xl font-medium" style={{ background: "rgba(34,211,238,0.15)", color: "#06b6d4" }}>
            Настроить
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
            <Icon name="Loader2" size={16} className="animate-spin" />
            Загружаем контакты...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Icon name="Users" size={32} className="opacity-30" />
            <div className="text-sm">Контактов не найдено</div>
            <button onClick={() => setShowForm(true)} className="text-xs px-3 py-1.5 rounded-xl font-medium" style={{ background: "rgba(139,92,246,0.2)", color: "#8b5cf6" }}>
              Добавить контакт
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                <th className="text-left px-5 py-3">Контакт</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3">Сегмент</th>
                <th className="text-left px-5 py-3">Статус</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">Добавлен</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-white/3 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(34,211,238,0.3))" }}>
                        {c.name ? c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : c.email[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{c.name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground font-mono-custom text-xs hidden md:table-cell">{c.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.3)" }}>
                      {c.segment}
                    </span>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400">
                      <Icon name="Trash2" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}