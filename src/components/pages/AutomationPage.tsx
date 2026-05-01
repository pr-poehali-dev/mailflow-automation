import { useState } from "react";
import Icon from "@/components/ui/icon";

type StepType = "trigger" | "email" | "delay" | "condition" | "sms" | "tag" | "webhook";

interface FlowStep {
  id: string;
  type: StepType;
  title: string;
  config: Record<string, string | number>;
}

interface Flow {
  id: number;
  name: string;
  description: string;
  steps: FlowStep[];
  is_active: boolean;
  total_started: number;
  total_completed: number;
  conversion: number;
}

const PREMADE_FLOWS: Flow[] = [
  {
    id: 1, name: "Welcome-серия для новых подписчиков",
    description: "5 писем за 14 дней — знакомим с продуктом и доводим до первой покупки",
    is_active: true, total_started: 1247, total_completed: 892, conversion: 71.5,
    steps: [
      { id: "1", type: "trigger", title: "Подписка на рассылку", config: { event: "subscribe" } },
      { id: "2", type: "email", title: "Письмо 1: Добро пожаловать!", config: { template: "Welcome", delay: "сразу" } },
      { id: "3", type: "delay", title: "Подождать 1 день", config: { duration: "1 день" } },
      { id: "4", type: "email", title: "Письмо 2: Главные возможности", config: { template: "Features" } },
      { id: "5", type: "delay", title: "Подождать 3 дня", config: { duration: "3 дня" } },
      { id: "6", type: "condition", title: "Открывал письма?", config: { condition: "opened > 0" } },
      { id: "7", type: "email", title: "Письмо 3: Кейс клиента", config: { template: "Case study" } },
    ],
  },
  {
    id: 2, name: "Брошенная корзина",
    description: "Возвращаем 38% покупателей через 3 касания",
    is_active: true, total_started: 3402, total_completed: 1289, conversion: 37.9,
    steps: [
      { id: "1", type: "trigger", title: "Корзина брошена > 2 часов", config: { event: "cart_abandoned" } },
      { id: "2", type: "delay", title: "Подождать 2 часа", config: { duration: "2 часа" } },
      { id: "3", type: "email", title: "Напомнить о товарах", config: { template: "Cart reminder" } },
      { id: "4", type: "delay", title: "Подождать 1 день", config: { duration: "1 день" } },
      { id: "5", type: "condition", title: "Купил?", config: { condition: "ordered" } },
      { id: "6", type: "email", title: "Скидка 10% на эти товары", config: { template: "Discount" } },
      { id: "7", type: "delay", title: "Подождать 2 дня", config: { duration: "2 дня" } },
      { id: "8", type: "sms", title: "SMS: последний шанс", config: { template: "Last chance" } },
    ],
  },
  {
    id: 3, name: "Реактивация спящих клиентов",
    description: "Те кто не заходил 90 дней — возвращаем 23%",
    is_active: false, total_started: 0, total_completed: 0, conversion: 0,
    steps: [
      { id: "1", type: "trigger", title: "Не активен 90 дней", config: { event: "inactive_90d" } },
      { id: "2", type: "email", title: "Соскучились!", config: { template: "We miss you" } },
      { id: "3", type: "delay", title: "Подождать 5 дней", config: { duration: "5 дней" } },
      { id: "4", type: "condition", title: "Открыл?", config: { condition: "opened" } },
      { id: "5", type: "email", title: "Скидка 30% на возвращение", config: { template: "Win-back" } },
      { id: "6", type: "tag", title: "Тег: реактивирован", config: { tag: "reactivated" } },
    ],
  },
  {
    id: 4, name: "День рождения клиента",
    description: "Поздравление + промокод за 7 дней до даты",
    is_active: true, total_started: 156, total_completed: 134, conversion: 85.9,
    steps: [
      { id: "1", type: "trigger", title: "За 7 дней до ДР", config: { event: "birthday_minus_7" } },
      { id: "2", type: "email", title: "Подарок ко дню рождения 🎂", config: { template: "Birthday" } },
      { id: "3", type: "delay", title: "В день ДР", config: { duration: "до даты ДР" } },
      { id: "4", type: "email", title: "С праздником! Промокод действует", config: { template: "BD reminder" } },
    ],
  },
];

const STEP_META: Record<StepType, { icon: string; color: string; bg: string; label: string }> = {
  trigger:   { icon: "Zap",       color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Триггер" },
  email:     { icon: "Mail",      color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", label: "Email" },
  delay:     { icon: "Clock",     color: "#06b6d4", bg: "rgba(6,182,212,0.1)",  label: "Задержка" },
  condition: { icon: "GitBranch", color: "#ec4899", bg: "rgba(236,72,153,0.1)", label: "Условие" },
  sms:       { icon: "MessageSquare", color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "SMS" },
  tag:       { icon: "Tag",       color: "#64748b", bg: "rgba(100,116,139,0.1)", label: "Тег" },
  webhook:   { icon: "Webhook",   color: "#0891b2", bg: "rgba(8,145,178,0.1)",  label: "Webhook" },
};

export function AutomationPage() {
  const [flows, setFlows] = useState<Flow[]>(PREMADE_FLOWS);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(PREMADE_FLOWS[0]);
  const [showLibrary, setShowLibrary] = useState(false);

  const totalActive = flows.filter((f) => f.is_active).length;
  const totalContacts = flows.reduce((s, f) => s + f.total_started, 0);
  const avgConversion = flows.length ? flows.reduce((s, f) => s + f.conversion, 0) / flows.length : 0;

  const toggleActive = (id: number) => {
    setFlows(flows.map((f) => f.id === id ? { ...f, is_active: !f.is_active } : f));
    if (selectedFlow?.id === id) {
      setSelectedFlow({ ...selectedFlow, is_active: !selectedFlow.is_active });
    }
  };

  const templates = [
    { name: "Welcome-серия", icon: "Hand", desc: "5 писем для новичков" },
    { name: "Брошенная корзина", icon: "ShoppingCart", desc: "Возврат 38%" },
    { name: "Реактивация", icon: "RefreshCw", desc: "Спящих клиентов" },
    { name: "День рождения", icon: "Cake", desc: "Поздравление + бонус" },
    { name: "Лид-магнит", icon: "Magnet", desc: "После скачивания PDF" },
    { name: "Опрос NPS", icon: "Star", desc: "После покупки" },
    { name: "Upsell", icon: "TrendingUp", desc: "Допродажа" },
    { name: "Триал заканчивается", icon: "AlertTriangle", desc: "Конверсия в платный" },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="fade-in-up flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Автоматизации
            <span className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>PRO</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Визуальные сценарии · триггеры → действия → условия</p>
        </div>
        <button onClick={() => setShowLibrary(!showLibrary)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
          <Icon name="Plus" size={15} />
          Создать сценарий
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Активных сценариев", value: totalActive, icon: "Zap", color: "#f59e0b" },
          { label: "Контактов в потоке", value: totalContacts.toLocaleString(), icon: "Users", color: "#8b5cf6" },
          { label: "Завершили", value: flows.reduce((s, f) => s + f.total_completed, 0).toLocaleString(), icon: "CheckCircle", color: "#10b981" },
          { label: "Средняя конверсия", value: `${avgConversion.toFixed(1)}%`, icon: "TrendingUp", color: "#06b6d4" },
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

      {/* Library модал */}
      {showLibrary && (
        <div className="glass rounded-2xl p-5 fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold">Библиотека готовых сценариев</div>
              <div className="text-xs text-muted-foreground">Выбери шаблон или создай свой с нуля</div>
            </div>
            <button onClick={() => setShowLibrary(false)} className="text-muted-foreground hover:text-foreground">
              <Icon name="X" size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {templates.map((t, i) => (
              <button key={i} className="text-left p-4 rounded-xl glass metric-card hover:bg-white/5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.08))" }}>
                  <Icon name={t.icon} size={16} style={{ color: "#8b5cf6" }} />
                </div>
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Список сценариев */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground px-2 mb-1">Мои сценарии</div>
          {flows.map((f) => {
            const active = selectedFlow?.id === f.id;
            return (
              <button key={f.id} onClick={() => setSelectedFlow(f)}
                className={`w-full text-left p-3 rounded-xl transition-all border ${
                  active ? "border-purple-500" : "border-border hover:border-white/20"
                }`}
                style={active ? { background: "rgba(139,92,246,0.06)" } : { background: "rgba(255,255,255,0.4)" }}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{f.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{f.description}</div>
                  </div>
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0`}
                    style={{ background: f.is_active ? "#10b981" : "#94a3b8" }} />
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Icon name="Users" size={11} />{f.total_started}</span>
                  <span className="flex items-center gap-1"><Icon name="TrendingUp" size={11} />{f.conversion}%</span>
                  <span className="flex items-center gap-1"><Icon name="GitBranch" size={11} />{f.steps.length}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Visual Builder */}
        <div className="lg:col-span-8">
          {selectedFlow ? (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <div>
                  <div className="font-bold">{selectedFlow.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedFlow.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(selectedFlow.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors`}
                    style={{ background: selectedFlow.is_active ? "#10b981" : "rgba(0,0,0,0.1)" }}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${selectedFlow.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                  <button className="text-xs px-3 py-1.5 rounded-lg font-medium glass hover:bg-white/8 flex items-center gap-1">
                    <Icon name="Settings" size={11} />Настроить
                  </button>
                </div>
              </div>

              <div className="p-5 max-h-[500px] overflow-y-auto"
                style={{ background: "linear-gradient(180deg, rgba(139,92,246,0.02), transparent)" }}>
                <div className="space-y-1">
                  {selectedFlow.steps.map((step, idx) => {
                    const meta = STEP_META[step.type];
                    return (
                      <div key={step.id}>
                        <div className="flex items-stretch gap-3 fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                          <div className="flex flex-col items-center">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: meta.bg, border: `1px solid ${meta.color}30` }}>
                              <Icon name={meta.icon} size={15} style={{ color: meta.color }} />
                            </div>
                          </div>
                          <div className="flex-1 glass rounded-xl p-3 metric-card">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase"
                                  style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                                <span className="font-medium text-sm">{step.title}</span>
                              </div>
                              <button className="text-muted-foreground hover:text-foreground">
                                <Icon name="MoreHorizontal" size={14} />
                              </button>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 font-mono-custom">
                              {Object.entries(step.config).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                            </div>
                          </div>
                        </div>
                        {idx < selectedFlow.steps.length - 1 && (
                          <div className="ml-4 my-1 h-4 w-px" style={{ background: "linear-gradient(180deg, #8b5cf6, #06b6d4)" }} />
                        )}
                      </div>
                    );
                  })}
                  <div className="flex items-stretch gap-3 mt-2">
                    <div className="ml-1 w-7" />
                    <button className="flex-1 py-2.5 rounded-xl border-2 border-dashed text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                      style={{ borderColor: "rgba(139,92,246,0.3)" }}>
                      <Icon name="Plus" size={13} />
                      Добавить шаг
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span><Icon name="Users" size={11} className="inline" /> В процессе: <span className="font-semibold text-foreground">{selectedFlow.total_started - selectedFlow.total_completed}</span></span>
                  <span><Icon name="CheckCircle" size={11} className="inline" /> Завершили: <span className="font-semibold text-foreground">{selectedFlow.total_completed}</span></span>
                </div>
                <span className="font-bold text-lg gradient-text">{selectedFlow.conversion}% конверсия</span>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl flex items-center justify-center py-20 text-muted-foreground">
              <div className="text-center">
                <Icon name="Workflow" size={32} className="mx-auto mb-2 opacity-30" />
                <div className="text-sm">Выбери сценарий слева</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AutomationPage;
