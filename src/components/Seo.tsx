import { useEffect } from "react";
import { Page } from "@/data/mockData";

interface SeoMeta {
  title: string;
  description: string;
  keywords?: string;
}

const SEO_BY_PAGE: Record<Page, SeoMeta> = {
  dashboard: {
    title: "Дашборд · MAIL-KA — статистика email-рассылок в реальном времени",
    description: "Главная панель MAIL-KA: контакты, отправленные письма, open rate, доход от рассылок. Все ключевые метрики email-маркетинга в одном дашборде.",
    keywords: "дашборд email маркетинг, статистика рассылок, open rate, метрики",
  },
  campaigns: {
    title: "Кампании · MAIL-KA — управление email-рассылками",
    description: "Создавайте, запускайте и анализируйте email-кампании. A/B-тесты, сегментация, расписание отправки, прогрев домена и DKIM из коробки.",
    keywords: "email кампании, рассылка писем, ab тесты email, сегментация рассылок",
  },
  contacts: {
    title: "Контакты · MAIL-KA — база подписчиков и сегментация",
    description: "Управление базой контактов: импорт CSV, сегменты, статусы, AI-скоринг, churn-prediction. До 1М контактов на одном тарифе.",
    keywords: "база контактов email, сегментация подписчиков, импорт контактов",
  },
  editor: {
    title: "AI-редактор писем · MAIL-KA — копирайтер на GPT-4o и Claude",
    description: "Визуальный редактор писем с AI-ассистентом: генерация текста, варианты тем, spam-чек, прогноз open rate. Работает на polza.ai (GPT-4o, Claude 3.5, DeepSeek).",
    keywords: "ai копирайтер писем, генератор email текстов, gpt-4o рассылка, claude для маркетинга",
  },
  automation: {
    title: "Автоматизации PRO · MAIL-KA — визуальные сценарии и триггеры",
    description: "Visual Automation Builder: welcome-серии, брошенная корзина, реактивация, день рождения. Триггеры → задержки → условия. Готовые шаблоны и кастомные сценарии.",
    keywords: "автоматизация email маркетинга, триггерные рассылки, welcome серия, брошенная корзина",
  },
  omnichannel: {
    title: "Omnichannel · MAIL-KA — Email + SMS + Telegram + Push в одной кампании",
    description: "8 каналов в одной платформе: Email, SMS (МТС, МегаФон, Билайн), Telegram, WhatsApp Business, Web Push, Mobile Push, Viber, VK. Каскадная отправка.",
    keywords: "омниканальный маркетинг, sms рассылка, telegram бот рассылка, push уведомления",
  },
  predict: {
    title: "Predictive AI · MAIL-KA — LTV-прогноз, churn risk, best send time",
    description: "AI-аналитика email-маркетинга: прогноз LTV для каждого контакта, выявление риска ухода, идеальное время отправки, retention curve, revenue attribution.",
    keywords: "predictive analytics email, ltv прогноз, churn prediction, best send time ai",
  },
  analytics: {
    title: "Аналитика · MAIL-KA — отчёты по рассылкам и поведению",
    description: "Подробная аналитика: open rate, CTR, тепловые карты кликов, географию открытий, устройства, конверсии. Экспорт в Excel, Google Sheets, Power BI.",
    keywords: "аналитика email маркетинга, отчёты рассылок, открываемость писем, ctr email",
  },
  integrations: {
    title: "Интеграции · MAIL-KA — Bitrix24, amoCRM, Telegram, Webhooks",
    description: "Подключите CRM, мессенджеры и аналитику: Bitrix24, amoCRM, SendGrid, Mailgun, Telegram Bot, Webhook. Двусторонняя синхронизация контактов и сделок.",
    keywords: "интеграции email маркетинга, bitrix24 email, amocrm рассылки, webhook email",
  },
  templates: {
    title: "Шаблоны писем · MAIL-KA — 50+ премиум-дизайнов",
    description: "Готовые шаблоны писем: онбординг, продажи, контент, триггеры, retention, день рождения. Адаптивная вёрстка для Gmail, Outlook, Apple Mail.",
    keywords: "шаблоны email писем, бесплатные email шаблоны, html шаблоны рассылок",
  },
  pricing: {
    title: "Тарифы MAIL-KA — от 990 ₽/мес · 7 дней бесплатно · скидка 30%",
    description: "Простые тарифы для email-маркетинга: Старт 990 ₽, Бизнес 2 990 ₽, Enterprise 7 990 ₽. 7-дневный пробный период без карты, скидка 30% при оплате за год. Безлимит писем, AI-копирайтер, автоматизации.",
    keywords: "тарифы email маркетинг, цена рассылок, стоимость email сервиса, бесплатный пробный период, скидка 30 процентов, тарифы mail-ka",
  },
  settings: {
    title: "Настройки · MAIL-KA — SMTP, домены, DKIM, команда",
    description: "Настройка отправителя, SMTP-сервера, DKIM-подписи, прогрев домена, управление командой и доступами, биллинг.",
    keywords: "smtp настройка, dkim email, прогрев домена, настройки рассылки",
  },
  api: {
    title: "API · MAIL-KA — REST API для разработчиков",
    description: "Полнофункциональный REST API: контакты, кампании, события, webhooks. SDK для Python, Node.js, PHP. До 100 запросов/сек.",
    keywords: "email api, rest api рассылки, webhook email, api для маркетологов",
  },
};

const BASE_URL = "https://mail-ka.ru";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function Seo({ page }: { page: Page }) {
  useEffect(() => {
    const meta = SEO_BY_PAGE[page];
    if (!meta) return;

    document.title = meta.title;
    setMeta("description", meta.description);
    if (meta.keywords) setMeta("keywords", meta.keywords);

    const url = page === "dashboard" ? `${BASE_URL}/` : `${BASE_URL}/?page=${page}`;
    setLink("canonical", url);

    setMeta("og:title", meta.title, "property");
    setMeta("og:description", meta.description, "property");
    setMeta("og:url", url, "property");
    setMeta("twitter:title", meta.title);
    setMeta("twitter:description", meta.description);
  }, [page]);

  return null;
}

export default Seo;