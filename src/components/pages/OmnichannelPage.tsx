import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Channel {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
  connected: boolean;
  sent_today: number;
  delivery_rate: number;
  cost_per_msg: string;
  features: string[];
}

const CHANNELS: Channel[] = [
  {
    id: "email", name: "Эл. почта", icon: "Mail", color: "#8b5cf6",
    desc: "Свой SMTP-движок · DKIM · прогрев домена",
    connected: true, sent_today: 8412, delivery_rate: 98.4,
    cost_per_msg: "~₽0.10",
    features: ["HTML-шаблоны", "Переменные", "A/B-тесты", "Открытия и клики"],
  },
  {
    id: "sms", name: "СМС", icon: "Smartphone", color: "#10b981",
    desc: "Прямые шлюзы МТС, МегаФон, Билайн, Tele2",
    connected: false, sent_today: 0, delivery_rate: 99.7,
    cost_per_msg: "~₽3.50",
    features: ["Транзакционные", "Рекламные", "Буквенное имя отправителя", "Одноразовые коды"],
  },
  {
    id: "telegram", name: "Телеграм", icon: "Send", color: "#06b6d4",
    desc: "Бот + рассылки в каналы и личные чаты",
    connected: false, sent_today: 0, delivery_rate: 100,
    cost_per_msg: "Бесплатно",
    features: ["Бот для подписки", "Кнопки и встроенные меню", "Фото и видео", "Платежи"],
  },
  {
    id: "whatsapp", name: "Ватсап для бизнеса", icon: "MessageCircle", color: "#16a34a",
    desc: "Через официальный интерфейс Meta · только в РФ",
    connected: false, sent_today: 0, delivery_rate: 99.2,
    cost_per_msg: "~₽5.20",
    features: ["Шаблоны Meta", "Каталог товаров", "Чат-бот", "Платежи"],
  },
  {
    id: "push", name: "Браузерные уведомления", icon: "Bell", color: "#f59e0b",
    desc: "Уведомления в браузере для подписчиков сайта",
    connected: false, sent_today: 0, delivery_rate: 87.3,
    cost_per_msg: "Бесплатно",
    features: ["Подписка на сайте", "Сегментация", "Картинки в уведомлениях", "Расписание"],
  },
  {
    id: "mobile", name: "Мобильные уведомления", icon: "Smartphone", color: "#ec4899",
    desc: "Через Firebase для приложений iOS и Android",
    connected: false, sent_today: 0, delivery_rate: 95.1,
    cost_per_msg: "Бесплатно",
    features: ["FCM для iOS/Android", "С картинками и кнопками", "Глубокие ссылки", "Тихие уведомления"],
  },
  {
    id: "viber", name: "Вайбер для бизнеса", icon: "MessageSquare", color: "#7c3aed",
    desc: "Бизнес-сообщения через официальные провайдеры",
    connected: false, sent_today: 0, delivery_rate: 96.8,
    cost_per_msg: "~₽2.10",
    features: ["Брендированные сообщения", "Кнопки", "Геолокация", "Каскадные сценарии"],
  },
  {
    id: "vk", name: "ВК Сообщения", icon: "Hash", color: "#0891b2",
    desc: "Рассылки подписчикам сообществ ВКонтакте",
    connected: false, sent_today: 0, delivery_rate: 99.0,
    cost_per_msg: "Бесплатно",
    features: ["Сообщества", "Карусели", "Платежи VK Pay", "Мини-приложения"],
  },
];

export function OmnichannelPage() {
  const [selectedCascade, setSelectedCascade] = useState<string[]>(["email", "sms"]);

  const channels = CHANNELS;
  const totalSent = channels.reduce((s, c) => s + c.sent_today, 0);
  const connectedCount = channels.filter((c) => c.connected).length;

  const toggleCascade = (id: string) => {
    setSelectedCascade(selectedCascade.includes(id)
      ? selectedCascade.filter((x) => x !== id)
      : [...selectedCascade, id]);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="fade-in-up flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Мультиканальные рассылки
            <span className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>НОВОЕ</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">8 каналов в одной платформе · единая статистика · каскадная отправка</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Каналов подключено", value: `${connectedCount} из ${channels.length}`, icon: "Network", color: "#8b5cf6" },
          { label: "Отправлено сегодня", value: totalSent.toLocaleString(), icon: "Send", color: "#06b6d4" },
          { label: "Средняя доставка", value: "97.8%", icon: "CheckCircle", color: "#10b981" },
          { label: "Расход за месяц", value: "₽ 12.4K", icon: "Coins", color: "#f59e0b" },
        ].map((s, i) => (
          <div key={i} className="glass rounded-2xl p-4 metric-card">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name={s.icon} size={14} style={{ color: s.color }} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Cascade builder */}
      <div className="glass rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(6,182,212,0.02))" }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="font-bold flex items-center gap-2">
              <Icon name="GitBranch" size={16} style={{ color: "#8b5cf6" }} />
              Каскадная отправка
            </h2>
            <p className="text-xs text-muted-foreground">Не открыл письмо за 2 часа? Отправим СМС. Не ответил? Телеграм. Экономия и рост откликов.</p>
          </div>
          <button className="text-xs px-4 py-2 rounded-xl font-semibold text-white flex items-center gap-1.5"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
            <Icon name="Play" size={12} />Запустить каскад
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedCascade.map((id, i) => {
            const c = channels.find((x) => x.id === id);
            if (!c) return null;
            return (
              <div key={id} className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: `${c.color}15`, border: `1px solid ${c.color}40` }}>
                  <Icon name={c.icon} size={13} style={{ color: c.color }} />
                  <span className="text-xs font-semibold">{c.name}</span>
                  <button onClick={() => toggleCascade(id)} className="text-muted-foreground hover:text-foreground">
                    <Icon name="X" size={11} />
                  </button>
                </div>
                {i < selectedCascade.length - 1 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Icon name="ArrowRight" size={11} />
                    <span>+2ч</span>
                    <Icon name="ArrowRight" size={11} />
                  </div>
                )}
              </div>
            );
          })}
          <button className="px-3 py-2 rounded-xl border-2 border-dashed text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            style={{ borderColor: "rgba(139,92,246,0.3)" }}>
            <Icon name="Plus" size={11} />Добавить канал
          </button>
        </div>
      </div>

      {/* Каналы */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {channels.map((c) => (
          <div key={c.id} className="glass rounded-2xl p-4 metric-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10 blur-2xl rounded-full"
              style={{ background: c.color }} />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${c.color}15`, border: `1px solid ${c.color}30` }}>
                  <Icon name={c.icon} size={18} style={{ color: c.color }} />
                </div>
                {c.connected ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                    style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                    Активен
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">скоро</span>
                )}
              </div>
              <div className="font-bold text-base">{c.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{c.desc}</div>

              <div className="grid grid-cols-2 gap-2 mt-3 py-2 border-t border-b border-border">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Доставка</div>
                  <div className="text-sm font-semibold font-mono-custom">{c.delivery_rate}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Цена</div>
                  <div className="text-sm font-semibold font-mono-custom">{c.cost_per_msg}</div>
                </div>
              </div>

              <div className="mt-2 space-y-0.5">
                {c.features.slice(0, 3).map((f, i) => (
                  <div key={i} className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Icon name="Check" size={10} style={{ color: c.color }} />
                    {f}
                  </div>
                ))}
              </div>

              <button className={`w-full mt-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                c.connected ? "glass hover:bg-white/8 text-foreground" : "text-white"
              }`}
                style={!c.connected ? { background: `linear-gradient(135deg, ${c.color}, ${c.color}aa)` } : {}}>
                {c.connected ? "Настроить" : "Подключить"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OmnichannelPage;