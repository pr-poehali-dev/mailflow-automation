import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  fetchCrmConnections, getCrmAuthorizeUrl, disconnectCrm,
  fetchCrmSyncStatus, runCrmSync,
  CrmConnection, CrmProvider, CrmSyncStatus, CrmSyncResult,
} from "@/api/crm";

interface CrmCard {
  id: string;
  name: string;
  description: string;
  logo: string;
  color: string;
  features: string[];
  authType: "oauth" | "token" | "webhook";
  popular?: boolean;
  needsDomain?: boolean;
}

const CRM_LIST: CrmCard[] = [
  {
    id: "bitrix24",
    name: "Битрикс24",
    description: "Двусторонняя синхронизация контактов и сделок. Триггеры рассылок при смене стадии воронки.",
    logo: "🔷",
    color: "#1da1f2",
    features: ["Контакты + сделки", "Триггеры по воронке", "Метки и теги", "Webhooks"],
    authType: "oauth",
    popular: true,
    needsDomain: true,
  },
  {
    id: "amocrm",
    name: "amoCRM",
    description: "Контакты, лиды и сделки синхронизируются автоматически. UTM-метки сохраняются.",
    logo: "🟠",
    color: "#fb923c",
    features: ["Контакты + лиды", "UTM-метки", "Цифровая воронка", "Webhooks"],
    authType: "oauth",
    popular: true,
  },
  {
    id: "retailcrm",
    name: "RetailCRM",
    description: "E-commerce интеграция: брошенные корзины, история покупок, сегменты по чекам.",
    logo: "🛒",
    color: "#10b981",
    features: ["Брошенная корзина", "История покупок", "LTV-сегменты", "Триггеры по заказам"],
    authType: "token",
    popular: true,
  },
  {
    id: "1c",
    name: "1С: Предприятие",
    description: "Обмен через REST-API или промежуточный обмен через 1С: Битрикс. Контрагенты и заказы.",
    logo: "🟡",
    color: "#facc15",
    features: ["Контрагенты", "Заказы и счета", "REST API + COM", "Расписание обмена"],
    authType: "token",
  },
  {
    id: "megaplan",
    name: "Мегаплан",
    description: "Синхронизация контактов и сделок. Запуск рассылок по событиям в задачах.",
    logo: "🟣",
    color: "#8b5cf6",
    features: ["Контакты + задачи", "Триггеры по статусу", "Webhooks", "Поля сделки"],
    authType: "token",
  },
  {
    id: "yclients",
    name: "YClients",
    description: "Запись на услуги в beauty/spa/медицине. Напоминания, реактивация, отзывы.",
    logo: "💅",
    color: "#ec4899",
    features: ["Запись на услугу", "Напоминания за 1 день", "Реактивация", "Сбор отзывов"],
    authType: "token",
  },
  {
    id: "moysklad",
    name: "МойСклад",
    description: "Товары, остатки, продажи. Триггеры рассылок «снова в наличии», скидки, новинки.",
    logo: "📦",
    color: "#06b6d4",
    features: ["Товары и остатки", "Снова в наличии", "Новинки", "Триггеры по продажам"],
    authType: "token",
  },
  {
    id: "tilda",
    name: "Tilda",
    description: "Формы Tilda → контакт в MAIL-KA. Webhook + автоматический welcome.",
    logo: "🎨",
    color: "#facc15",
    features: ["Формы → контакты", "Welcome-письмо", "Webhook за 1 минуту", "UTM-метки"],
    authType: "webhook",
    popular: true,
  },
];

const OAUTH_PROVIDERS: Set<string> = new Set(["bitrix24", "amocrm"]);

export default function CrmIntegrations() {
  const [connections, setConnections] = useState<CrmConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePopup, setActivePopup] = useState<CrmCard | null>(null);
  const [domain, setDomain] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState<Record<string, CrmSyncStatus>>({});
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<CrmSyncResult | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const items = await fetchCrmConnections();
      setConnections(items);
      // Догружаем статус синхронизации для каждой OAuth-CRM
      const statusEntries = await Promise.all(
        items
          .filter((c) => OAUTH_PROVIDERS.has(c.provider) && c.status === "active")
          .map(async (c) => [c.provider, await fetchCrmSyncStatus(c.provider as CrmProvider)] as const),
      );
      setSyncStatus(Object.fromEntries(statusEntries));
    } catch {
      setConnections([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSync = async (id: string) => {
    setSyncing(id);
    setSyncResult(null);
    const res = await runCrmSync(id as CrmProvider);
    setSyncResult(res);
    setSyncing(null);
    // Обновим статус
    const status = await fetchCrmSyncStatus(id as CrmProvider);
    setSyncStatus((prev) => ({ ...prev, [id]: status }));
  };

  const formatSyncTime = (iso?: string | null) => {
    if (!iso) return "ещё не было";
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "только что";
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  // Слушаем сообщение из popup-окна OAuth
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "mk-oauth-success") {
        load();
        setActivePopup(null);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const isConnected = (id: string) => connections.some((c) => c.provider === id && c.status === "active");
  const getConnection = (id: string) => connections.find((c) => c.provider === id);

  const startOAuth = async (card: CrmCard) => {
    setConnecting(true);
    setError("");
    if (card.needsDomain && !domain.trim()) {
      setError("Укажите адрес портала (например your-company.bitrix24.ru)");
      setConnecting(false);
      return;
    }
    const res = await getCrmAuthorizeUrl(card.id as CrmProvider, domain.trim() || undefined);
    setConnecting(false);
    if (!res.ok || !res.url) {
      setError(res.error || "Не удалось начать авторизацию");
      return;
    }
    const popup = window.open(res.url, "mk_oauth", "width=720,height=720");
    if (!popup) {
      setError("Разрешите всплывающие окна для подключения CRM");
      return;
    }
    const tick = setInterval(() => {
      if (popup.closed) {
        clearInterval(tick);
        load();
      }
    }, 1000);
  };

  const handleDisconnect = async (id: string) => {
    await disconnectCrm(id as CrmProvider);
    await load();
    setActivePopup(null);
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">CRM и сервисы — нативная интеграция</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              НОВОЕ
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Подключайте за 2 минуты. Никаких Zapier и сторонних прокладок.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Подключено:{" "}
          <span className="font-bold text-foreground">
            {loading ? "…" : connections.filter((c) => c.status === "active").length}
          </span>{" "}
          из {CRM_LIST.length}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CRM_LIST.map((p) => {
          const connected = isConnected(p.id);
          return (
            <div key={p.id}
              className="relative rounded-2xl p-4 transition-all hover:scale-[1.02] cursor-pointer"
              onClick={() => { setActivePopup(p); setDomain(getConnection(p.id)?.domain || ""); setError(""); }}
              style={{
                background: connected ? `${p.color}10` : "rgba(255,255,255,0.03)",
                border: `1px solid ${connected ? `${p.color}40` : "var(--border)"}`,
              }}>
              {p.popular && !connected && (
                <span className="absolute -top-2 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}>
                  ТОП
                </span>
              )}
              {connected && (
                <span className="absolute top-3 right-3">
                  <Icon name="CheckCircle" size={16} style={{ color: p.color }} />
                </span>
              )}
              <div className="text-3xl mb-2">{p.logo}</div>
              <div className="font-bold text-sm mb-1">{p.name}</div>
              <div className="text-[11px] text-muted-foreground line-clamp-2 mb-3">
                {p.description}
              </div>
              {connected && OAUTH_PROVIDERS.has(p.id) && syncStatus[p.id]?.last_sync_at && (
                <div className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                  <Icon name="RefreshCw" size={10} />
                  Контактов: {syncStatus[p.id].last_sync_count || 0} · {formatSyncTime(syncStatus[p.id].last_sync_at)}
                </div>
              )}
              <div className="text-xs font-semibold flex items-center gap-1"
                style={{ color: p.color }}>
                {connected ? "Управлять" : "Подключить"}
                <Icon name="ArrowRight" size={11} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {activePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 fade-in-up overflow-y-auto"
          style={{ background: "rgba(10,10,22,0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => setActivePopup(null)}>
          <div onClick={(e) => e.stopPropagation()}
            className="glass rounded-2xl w-full max-w-md p-5 sm:p-6 my-auto max-h-[calc(100vh-1.5rem)] overflow-y-auto"
            style={{ border: `2px solid ${activePopup.color}40` }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: `${activePopup.color}15` }}>
                {activePopup.logo}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">{activePopup.name}</div>
                <div className="text-xs text-muted-foreground">{activePopup.description}</div>
              </div>
              <button onClick={() => setActivePopup(null)}
                className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={18} />
              </button>
            </div>

            <div className="space-y-2 mb-5">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                Что синхронизируется
              </div>
              {activePopup.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Icon name="Check" size={14} style={{ color: activePopup.color }} />
                  {f}
                </div>
              ))}
            </div>

            {OAUTH_PROVIDERS.has(activePopup.id) && (
              <>
                {activePopup.needsDomain && !isConnected(activePopup.id) && (
                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground block mb-1.5">
                      Адрес вашего портала
                    </label>
                    <input
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="your-company.bitrix24.ru"
                      className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500"
                    />
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Без https:// — только домен. Например: <code>mycompany.bitrix24.ru</code>
                    </div>
                  </div>
                )}

                <div className="rounded-xl p-3 mb-4 text-xs"
                  style={{ background: `${activePopup.color}08`, border: `1px solid ${activePopup.color}25` }}>
                  <div className="flex items-start gap-2">
                    <Icon name="Shield" size={14} style={{ color: activePopup.color }} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold mb-0.5">Авторизация через OAuth 2.0</div>
                      <div className="text-muted-foreground">
                        Откроется официальное окно {activePopup.name}. Пароль не передаётся в MAIL-KA — только токен доступа.
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl p-3 mb-3 text-xs"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                    {error}
                  </div>
                )}

                {isConnected(activePopup.id) && (
                  <div className="rounded-xl p-3 mb-4 text-xs space-y-2"
                    style={{ background: `${activePopup.color}08`, border: `1px solid ${activePopup.color}20` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Последняя синхронизация:</span>
                      <span className="font-semibold">
                        {formatSyncTime(syncStatus[activePopup.id]?.last_sync_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Контактов в базе:</span>
                      <span className="font-semibold">
                        {syncStatus[activePopup.id]?.last_sync_count ?? 0}
                      </span>
                    </div>
                    {syncResult && syncing === null && (
                      <div className="pt-2 border-t border-border">
                        {syncResult.ok ? (
                          <div style={{ color: "#10b981" }}>
                            ✓ Добавлено: {syncResult.inserted}, обновлено: {syncResult.updated}
                            {syncResult.skipped ? `, пропущено: ${syncResult.skipped}` : ""}
                          </div>
                        ) : (
                          <div style={{ color: "#ef4444" }}>{syncResult.error || "Не удалось"}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {isConnected(activePopup.id) ? (
                    <>
                      <button
                        onClick={() => handleSync(activePopup.id)}
                        disabled={syncing === activePopup.id}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                        style={{ background: `linear-gradient(135deg, ${activePopup.color}, #06b6d4)` }}>
                        {syncing === activePopup.id
                          ? <Icon name="Loader2" size={14} className="animate-spin" />
                          : <Icon name="RefreshCw" size={14} />}
                        {syncing === activePopup.id ? "Синхронизируем…" : "Синхронизировать сейчас"}
                      </button>
                      <button
                        onClick={() => handleDisconnect(activePopup.id)}
                        className="w-full py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/30">
                        Отключить
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startOAuth(activePopup)}
                      disabled={connecting}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                      style={{ background: `linear-gradient(135deg, ${activePopup.color}, #06b6d4)` }}>
                      {connecting && <Icon name="Loader2" size={14} className="animate-spin" />}
                      Войти и подключить
                    </button>
                  )}
                </div>

                <div className="text-[10px] text-muted-foreground text-center mt-3">
                  {isConnected(activePopup.id)
                    ? "Контакты подтянутся в раздел «Контакты» с тегом CRM"
                    : "Среднее время настройки: 2 минуты · OAuth 2.0"}
                </div>
              </>
            )}

            {activePopup.authType === "token" && !OAUTH_PROVIDERS.has(activePopup.id) && (
              <div className="rounded-xl p-3 mb-4 text-xs space-y-2"
                style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.25)" }}>
                <div className="flex items-start gap-2">
                  <Icon name="Clock" size={14} style={{ color: "#f59e0b" }} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold mb-0.5">Скоро — раскатываем по очереди</div>
                    <div className="text-muted-foreground">
                      OAuth для {activePopup.name} в разработке. Пока подключайте через Webhooks API в разделе «Программный интерфейс».
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePopup.authType === "webhook" && (
              <div className="space-y-3 mb-4">
                <div className="text-xs text-muted-foreground">
                  Скопируйте webhook-ссылку и вставьте в настройки {activePopup.name}:
                </div>
                <div className="rounded-xl p-3 font-mono-custom text-[11px] break-all"
                  style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)" }}>
                  https://hook.mail-ka.ru/in/{activePopup.id}/abc123def456
                </div>
                <button className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1.5">
                  <Icon name="Copy" size={12} />
                  Скопировать
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}