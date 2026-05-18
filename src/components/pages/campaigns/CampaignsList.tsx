import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { StatusBadge } from "@/components/shared";
import {
  fetchCampaigns, createCampaign, updateCampaign, deleteCampaign,
  Campaign,
} from "@/api";

export default function CampaignsList() {
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
