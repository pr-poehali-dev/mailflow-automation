export default function CookieDoc() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-foreground">
      <header>
        <h1 className="text-2xl font-bold mb-1">Политика использования файлов Cookie</h1>
        <p className="text-xs text-muted-foreground">
          Редакция 1.0 от 01.05.2026 · ООО «МАТ-Лабс»
        </p>
      </header>

      <section>
        <p>
          Сайт mail-ka.ru использует файлы cookie и аналогичные технологии для обеспечения
          работы сервиса, аналитики и улучшения пользовательского опыта.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mt-5 mb-2">Какие cookie мы используем</h2>
        <table className="w-full text-xs border-collapse mt-2">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-3 font-semibold">Категория</th>
              <th className="text-left py-2 pr-3 font-semibold">Назначение</th>
              <th className="text-left py-2 pr-3 font-semibold">Срок</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-border/50">
              <td className="py-2 pr-3 text-foreground">Технические</td>
              <td className="py-2 pr-3">сессия, авторизация, CSRF</td>
              <td className="py-2 pr-3">30 дней</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-3 text-foreground">Функциональные</td>
              <td className="py-2 pr-3">тема оформления, язык, настройки</td>
              <td className="py-2 pr-3">1 год</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-3 text-foreground">Аналитические</td>
              <td className="py-2 pr-3">Яндекс.Метрика — статистика посещений</td>
              <td className="py-2 pr-3">2 года</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-base font-semibold mt-5 mb-2">Управление cookie</h2>
        <p>
          Вы можете отключить cookie в настройках браузера. Это может повлиять на работу
          некоторых функций сайта (например, вход в личный кабинет станет невозможен).
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mt-5 mb-2">Третьи стороны</h2>
        <p>
          На сайте установлен счётчик Яндекс.Метрика (АО «Яндекс»). Подробнее об обработке данных
          этим сервисом — в{" "}
          <a href="https://yandex.ru/legal/confidential/" target="_blank" rel="noopener" className="underline">
            Политике конфиденциальности Яндекса
          </a>.
        </p>
      </section>
    </div>
  );
}
