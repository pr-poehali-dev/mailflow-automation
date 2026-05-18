import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  fetchReferralMe,
  fetchReferralHistory,
  fetchBonusHistory,
  ReferralMe,
  ReferralItem,
  BonusTx,
} from "@/api/referrals";

export default function ReferralsPage() {
  const [me, setMe] = useState<ReferralMe | null>(null);
  const [items, setItems] = useState<ReferralItem[]>([]);
  const [bonuses, setBonuses] = useState<BonusTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [tab, setTab] = useState<"invited" | "bonuses">("invited");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [meR, histR, bonR] = await Promise.all([
        fetchReferralMe(),
        fetchReferralHistory(),
        fetchBonusHistory(),
      ]);
      if (meR && "referral_code" in meR && meR.ok) setMe(meR as ReferralMe);
      if (histR.ok) setItems(histR.items);
      if (bonR.ok) setBonuses(bonR.items);
      setLoading(false);
    })();
  }, []);

  const handleCopy = (text: string, what: "code" | "link") => {
    navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = (channel: "tg" | "wa" | "vk" | "mail") => {
    if (!me) return;
    const text = `Привет! Попробуй MAIL-KA — email-маркетинг с AI. Регистрируйся по моей ссылке и получи скидку: ${me.referral_link}`;
    const enc = encodeURIComponent(text);
    const url = encodeURIComponent(me.referral_link);
    const urls: Record<string, string> = {
      tg: `https://t.me/share/url?url=${url}&text=${enc}`,
      wa: `https://wa.me/?text=${enc}`,
      vk: `https://vk.com/share.php?url=${url}&title=${encodeURIComponent("MAIL-KA — email-маркетинг с AI")}`,
      mail: `mailto:?subject=${encodeURIComponent("Попробуй MAIL-KA")}&body=${enc}`,
    };
    window.open(urls[channel], "_blank");
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center text-muted-foreground gap-2 text-sm">
        <Icon name="Loader2" size={16} className="animate-spin" />
        Загружаем реферальную программу...
      </div>
    );
  }

  if (!me) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-muted-foreground gap-3 py-16">
        <Icon name="Lock" size={32} className="opacity-30" />
        <div className="text-sm">Войдите, чтобы получить свою реферальную ссылку</div>
      </div>
    );
  }

  const fmtDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Приведи друга — получи {me.bonus_per_referral} ₽</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Делитесь ссылкой. За каждого друга, который оплатит подписку, мы зачисляем {me.bonus_per_referral} ₽ на ваш бонусный баланс.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Бонусный баланс", value: `${me.stats.balance.toLocaleString("ru-RU")} ₽`, icon: "Wallet", color: "#10b981" },
          { label: "Оплативших друзей", value: me.stats.converted, icon: "UserCheck", color: "#8b5cf6" },
          { label: "В процессе", value: me.stats.pending, icon: "Clock", color: "#f59e0b" },
          { label: "Всего заработано", value: `${me.stats.total_earned.toLocaleString("ru-RU")} ₽`, icon: "TrendingUp", color: "#06b6d4" },
        ].map((s, i) => (
          <div key={i} className="glass rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ background: `radial-gradient(circle at 80% 20%, ${s.color}, transparent 70%)` }} />
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                style={{ background: `${s.color}22`, border: `1px solid ${s.color}44` }}>
                <Icon name={s.icon} size={16} style={{ color: s.color }} />
              </div>
              <div className="text-xl sm:text-2xl font-bold">{s.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Code & link */}
      <div className="glass rounded-2xl p-5 space-y-4"
        style={{ border: "1px solid rgba(139,92,246,0.25)" }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
            <Icon name="Gift" size={16} className="text-white" />
          </div>
          <div>
            <div className="font-semibold">Ваш реферальный код</div>
            <div className="text-xs text-muted-foreground">Поделитесь им или используйте ссылку</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* code */}
          <div className="rounded-xl p-3 flex items-center justify-between"
            style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)" }}>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Код</div>
              <div className="font-mono-custom text-lg font-bold truncate" style={{ color: "#8b5cf6" }}>
                {me.referral_code}
              </div>
            </div>
            <button
              onClick={() => handleCopy(me.referral_code, "code")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold glass hover:bg-white/8 flex items-center gap-1.5">
              <Icon name={copied === "code" ? "Check" : "Copy"} size={12} />
              {copied === "code" ? "Скопировано" : "Копировать"}
            </button>
          </div>

          {/* link */}
          <div className="rounded-xl p-3 flex items-center justify-between"
            style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)" }}>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Ссылка</div>
              <div className="font-mono-custom text-xs truncate" style={{ color: "#06b6d4" }}>
                {me.referral_link}
              </div>
            </div>
            <button
              onClick={() => handleCopy(me.referral_link, "link")}
              className="ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold glass hover:bg-white/8 flex items-center gap-1.5 flex-shrink-0">
              <Icon name={copied === "link" ? "Check" : "Copy"} size={12} />
              {copied === "link" ? "OK" : "Копировать"}
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Поделиться</div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "tg", label: "Telegram", icon: "Send", color: "#06b6d4" },
              { id: "wa", label: "WhatsApp", icon: "MessageCircle", color: "#10b981" },
              { id: "vk", label: "VK", icon: "Share2", color: "#0077ff" },
              { id: "mail", label: "Email", icon: "Mail", color: "#8b5cf6" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => handleShare(s.id as "tg" | "wa" | "vk" | "mail")}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold glass hover:bg-white/8 transition-colors">
                <Icon name={s.icon} size={13} style={{ color: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { n: 1, icon: "Share2", title: "Отправьте ссылку", text: "Скиньте друзьям, в чат, на канал или в личку." },
          { n: 2, icon: "UserPlus", title: "Друг регистрируется", text: "По вашей ссылке без дополнительных действий." },
          { n: 3, icon: "Wallet", title: "Получаете 500 ₽", text: "Бонус автоматически после первой оплаты друга." },
        ].map((s) => (
          <div key={s.n} className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", color: "white" }}>
                {s.n}
              </div>
              <Icon name={s.icon} size={14} className="text-muted-foreground" />
              <div className="font-semibold text-sm">{s.title}</div>
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">{s.text}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-xl p-1 w-fit">
        {[
          { id: "invited", label: `Приглашённые (${items.length})`, icon: "Users" },
          { id: "bonuses", label: `Начисления (${bonuses.length})`, icon: "Wallet" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as "invited" | "bonuses")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              tab === t.id ? "text-white" : "text-muted-foreground hover:text-foreground"
            }`}
            style={tab === t.id ? { background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" } : {}}>
            <Icon name={t.icon} size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="glass rounded-2xl overflow-hidden">
        {tab === "invited" ? (
          items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Icon name="UserPlus" size={28} className="opacity-30" />
              <div className="text-sm">Пока никого не пригласили</div>
              <div className="text-xs">Поделитесь ссылкой выше — это занимает 10 секунд</div>
            </div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Статус</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Приглашён</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">Оплатил</th>
                  <th className="text-right px-5 py-3">Бонус</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3.5 font-mono-custom text-xs">{r.email}</td>
                    <td className="px-5 py-3.5">
                      {r.status === "converted" ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">Оплатил</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-500">Ожидает</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs hidden md:table-cell">{fmtDate(r.invited_at)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">{fmtDate(r.converted_at)}</td>
                    <td className="px-5 py-3.5 text-right font-mono-custom">
                      {r.bonus > 0 ? (
                        <span style={{ color: "#10b981" }}>+{r.bonus.toLocaleString("ru-RU")} ₽</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )
        ) : bonuses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Icon name="Wallet" size={28} className="opacity-30" />
            <div className="text-sm">Начислений пока нет</div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {bonuses.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(16,185,129,0.15)" }}>
                    <Icon name="Plus" size={14} style={{ color: "#10b981" }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{b.description || b.type}</div>
                    <div className="text-[10px] text-muted-foreground">{fmtDate(b.created_at)}</div>
                  </div>
                </div>
                <span className="font-mono-custom font-semibold" style={{ color: "#10b981" }}>
                  +{b.amount.toLocaleString("ru-RU")} ₽
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
