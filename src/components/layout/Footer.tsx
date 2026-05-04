import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { Page } from "@/data/mockData";

interface Props {
  setPage?: (p: Page) => void;
}

export function Footer({ setPage }: Props) {
  const [legalOpen, setLegalOpen] = useState(false);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border/60 px-4 sm:px-6 py-6 text-[11px] text-muted-foreground space-y-3"
      style={{ background: "linear-gradient(180deg, transparent, rgba(139,92,246,0.03))" }}>

      {/* Главная строка */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
            <Icon name="Mail" size={11} className="text-white" />
          </div>
          <span className="font-semibold text-foreground">MAIL-KA</span>
          <span>— интеллектуальный продукт</span>
          <span className="font-semibold text-foreground">ООО «МАТ-Лабс»</span>
        </div>
        <div className="text-[10px]">© {year} ООО «МАТ-Лабс». Все права защищены.</div>
      </div>

      {/* Ключевая плашка: роль платформы */}
      <div className="rounded-xl p-3 flex items-start gap-2"
        style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.22)" }}>
        <Icon name="Info" size={12} style={{ color: "#06b6d4", marginTop: 1 }} className="flex-shrink-0" />
        <div className="leading-relaxed text-[11px]">
          MAIL-KA — это <span className="font-semibold text-foreground">программный инструмент</span> для отправки
          собственных коммуникаций пользователя. ООО «МАТ-Лабс»{" "}
          <span className="font-semibold text-foreground">не является рекламодателем, рекламораспространителем
          или рекламопроизводителем</span> по смыслу ст. 3 Федерального закона № 38-ФЗ «О рекламе». Содержание,
          адресаты и законность рассылок определяются исключительно пользователем сервиса, который выступает
          самостоятельным рекламодателем и несёт полную ответственность за соблюдение 38-ФЗ, 152-ФЗ, 149-ФЗ и
          иных применимых норм РФ.
        </div>
      </div>

      {/* Юридические данные */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
        <span className="flex items-center gap-1">
          <Icon name="Building2" size={10} />
          ООО «МАТ-Лабс»
        </span>
        <span className="font-mono">ИНН 6312223437</span>
        <span className="flex items-center gap-1">
          <Icon name="Mail" size={10} />
          <a href="mailto:hello@mail-ka.ru" className="hover:text-foreground transition-colors">hello@mail-ka.ru</a>
        </span>
        <span className="flex items-center gap-1">
          <Icon name="MessageCircle" size={10} />
          <a href="mailto:abuse@mail-ka.ru" className="hover:text-foreground transition-colors">abuse@mail-ka.ru</a>
          <span className="text-muted-foreground/70">— жалобы на спам</span>
        </span>
      </div>

      {/* Ссылки на правовые документы */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 border-t border-border/40">
        <button onClick={() => setLegalOpen((v) => !v)}
          className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Icon name={legalOpen ? "ChevronDown" : "ChevronRight"} size={10} />
          Правовая информация
        </button>
        <a href="/oferta" className="hover:text-foreground transition-colors">Договор-оферта</a>
        <a href="/privacy" className="hover:text-foreground transition-colors">Политика конфиденциальности</a>
        <a href="/personal-data" className="hover:text-foreground transition-colors">Согласие на обработку ПДн</a>
        <a href="/advertising-policy" className="hover:text-foreground transition-colors">Правила рассылок</a>
        {setPage && (
          <button onClick={() => setPage("pricing")} className="hover:text-foreground transition-colors">
            Тарифы
          </button>
        )}
      </div>

      {/* Раскрываемая правовая справка */}
      {legalOpen && (
        <div className="rounded-xl p-3 space-y-2 fade-in-up"
          style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.18)" }}>
          <div className="flex items-start gap-2">
            <Icon name="Scale" size={11} style={{ color: "#8b5cf6", marginTop: 2 }} />
            <div>
              <div className="font-semibold text-foreground mb-1">Соблюдение закона «О рекламе» (38-ФЗ)</div>
              <p className="leading-relaxed">
                Пользователь сервиса MAIL-KA является самостоятельным рекламодателем своих рассылок и обязан
                соблюдать требования Федерального закона № 38-ФЗ «О рекламе», № 152-ФЗ «О персональных данных»
                и № 149-ФЗ «Об информации». Рассылка по электронной почте, SMS и в мессенджеры допускается
                только при наличии предварительного согласия адресата (ст. 18 38-ФЗ). В каждом письме обязательны:
                идентификация рекламодателя, контактные данные и техническая возможность отписки в один клик.
                ООО «МАТ-Лабс» предоставляет лишь программно-технические средства и не контролирует содержание
                сообщений, отправляемых пользователями.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Icon name="ShieldAlert" size={11} style={{ color: "#f59e0b", marginTop: 2 }} />
            <div>
              <div className="font-semibold text-foreground mb-1">Маркировка интернет-рекламы (ОРД)</div>
              <p className="leading-relaxed">
                С 1 сентября 2022 г. вся реклама в сети обязана маркироваться через Оператора Рекламных
                Данных и содержать пометку «Реклама», ИНН рекламодателя и токен (erid). MAIL-KA рекомендует
                добавлять erid-токен в рассылки и предоставляет возможность хранить его в каждой кампании.
                Ответственность за корректную маркировку и отчётность в ЕРИР несёт рекламодатель — пользователь сервиса.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Icon name="FileCheck2" size={11} style={{ color: "#10b981", marginTop: 2 }} />
            <div>
              <div className="font-semibold text-foreground mb-1">Запрет спама</div>
              <p className="leading-relaxed">
                Использование сервиса MAIL-KA для рассылки несогласованных сообщений (спама) запрещено.
                Аккаунты, нарушающие политику, блокируются без возврата средств. Жалобы на спам:
                <a href="mailto:abuse@mail-ka.ru" className="underline hover:text-foreground ml-1">abuse@mail-ka.ru</a>.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="text-[9px] opacity-70 pt-1">
        Сервис не является средством массовой информации. Информация на странице тарифов носит справочный
        характер и не является публичной офертой (ст. 437 ГК РФ).
      </div>
    </footer>
  );
}

export default Footer;