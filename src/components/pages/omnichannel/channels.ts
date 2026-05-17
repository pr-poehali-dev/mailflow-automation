export interface Channel {
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
  coming_soon?: boolean;
}

// SMS и WhatsApp временно скрыты до подключения провайдеров.
// Email — единственный реально активный канал, остальные помечены «скоро».
export const CHANNELS: Channel[] = [
  {
    id: "email", name: "Эл. почта", icon: "Mail", color: "#8b5cf6",
    desc: "Свой SMTP-движок · DKIM · прогрев домена",
    connected: true, sent_today: 0, delivery_rate: 98.4,
    cost_per_msg: "~₽0.10",
    features: ["HTML-шаблоны", "Переменные", "A/B-тесты", "Открытия и клики"],
  },
  {
    id: "telegram", name: "Телеграм", icon: "Send", color: "#06b6d4",
    desc: "Бот + рассылки в каналы и личные чаты",
    connected: false, sent_today: 0, delivery_rate: 100,
    cost_per_msg: "Бесплатно",
    features: ["Бот для подписки", "Кнопки и встроенные меню", "Фото и видео", "Платежи"],
    coming_soon: true,
  },
  {
    id: "push", name: "Браузерные уведомления", icon: "Bell", color: "#f59e0b",
    desc: "Уведомления в браузере для подписчиков сайта",
    connected: false, sent_today: 0, delivery_rate: 87.3,
    cost_per_msg: "Бесплатно",
    features: ["Подписка на сайте", "Сегментация", "Картинки в уведомлениях", "Расписание"],
    coming_soon: true,
  },
  {
    id: "mobile", name: "Мобильные уведомления", icon: "Smartphone", color: "#ec4899",
    desc: "Через Firebase для приложений iOS и Android",
    connected: false, sent_today: 0, delivery_rate: 95.1,
    cost_per_msg: "Бесплатно",
    features: ["FCM для iOS/Android", "С картинками и кнопками", "Глубокие ссылки", "Тихие уведомления"],
    coming_soon: true,
  },
  {
    id: "viber", name: "Вайбер для бизнеса", icon: "MessageSquare", color: "#7c3aed",
    desc: "Бизнес-сообщения через официальные провайдеры",
    connected: false, sent_today: 0, delivery_rate: 96.8,
    cost_per_msg: "~₽2.10",
    features: ["Брендированные сообщения", "Кнопки", "Геолокация", "Каскадные сценарии"],
    coming_soon: true,
  },
  {
    id: "vk", name: "ВК Сообщения", icon: "Hash", color: "#0891b2",
    desc: "Рассылки подписчикам сообществ ВКонтакте",
    connected: false, sent_today: 0, delivery_rate: 99.0,
    cost_per_msg: "Бесплатно",
    features: ["Сообщества", "Карусели", "Платежи VK Pay", "Мини-приложения"],
    coming_soon: true,
  },
];
