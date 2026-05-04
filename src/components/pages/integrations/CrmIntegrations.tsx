import { useState } from "react";
import Icon from "@/components/ui/icon";

interface CrmProvider {
  id: string;
  name: string;
  description: string;
  logo: string;
  color: string;
  features: string[];
  authType: "oauth" | "token" | "webhook";
  popular?: boolean;
}

const CRM_PROVIDERS: CrmProvider[] = [
  {
    id: "bitrix24",
    name: "Битрикс24",
    description: "Двусторонняя синхронизация контактов и сделок. Триггеры рассылок при смене стадии воронки.",
    logo: "🔷",
    color: "#1da1f2",
    features: ["Контакты + сделки", "Триггеры по воронке", "Метки и теги", "Webhooks"],
    authType: "oauth",
    popular: true,
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

export default function CrmIntegrations() {
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [activePopup, setActivePopup] = useState<CrmProvider | null>(null);

  const handleConnect = (id: string) => {
    setConnected(new Set([...connected, id]));
    setActivePopup(null);
  };
  const handleDisconnect = (id: string) => {
    const next = new Set(connected);
    next.delete(id);
    setConnected(next);
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
          Подключено: <span className="font-bold text-foreground">{connected.size}</span> из {CRM_PROVIDERS.length}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CRM_PROVIDERS.map((p) => {
          const isConnected = connected.has(p.id);
          return (
            <div key={p.id}
              className="relative rounded-2xl p-4 transition-all hover:scale-[1.02] cursor-pointer"
              onClick={() => setActivePopup(p)}
              style={{
                background: isConnected ? `${p.color}10` : "rgba(255,255,255,0.03)",
                border: `1px solid ${isConnected ? `${p.color}40` : "var(--border)"}`,
              }}>
              {p.popular && !isConnected && (
                <span className="absolute -top-2 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)" }}>
                  ТОП
                </span>
              )}
              {isConnected && (
                <span className="absolute top-3 right-3">
                  <Icon name="CheckCircle" size={16} style={{ color: p.color }} />
                </span>
              )}
              <div className="text-3xl mb-2">{p.logo}</div>
              <div className="font-bold text-sm mb-1">{p.name}</div>
              <div className="text-[11px] text-muted-foreground line-clamp-2 mb-3">
                {p.description}
              </div>
              <div className="text-xs font-semibold flex items-center gap-1"
                style={{ color: p.color }}>
                {isConnected ? "Настроить" : "Подключить"}
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

            {activePopup.authType === "oauth" && (
              <div className="rounded-xl p-3 mb-4 text-xs"
                style={{ background: `${activePopup.color}08`, border: `1px solid ${activePopup.color}25` }}>
                <div className="flex items-start gap-2">
                  <Icon name="Shield" size={14} style={{ color: activePopup.color }} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold mb-0.5">Авторизация через OAuth</div>
                    <div className="text-muted-foreground">
                      Войдёте в свой аккаунт {activePopup.name} в защищённом окне. Пароль не передаётся в MAIL-KA.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePopup.authType === "token" && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">API-ключ</label>
                  <input type="password" placeholder="Вставьте токен из настроек CRM"
                    className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Адрес сервера</label>
                  <input placeholder={`https://your-company.${activePopup.id}.ru`}
                    className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500" />
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

            <div className="flex gap-2">
              {connected.has(activePopup.id) ? (
                <button
                  onClick={() => handleDisconnect(activePopup.id)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/30">
                  Отключить
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(activePopup.id)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${activePopup.color}, #06b6d4)` }}>
                  {activePopup.authType === "oauth" ? "Войти и подключить" : "Подключить"}
                </button>
              )}
            </div>

            <div className="text-[10px] text-muted-foreground text-center mt-3">
              Среднее время настройки: 2 минуты
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
