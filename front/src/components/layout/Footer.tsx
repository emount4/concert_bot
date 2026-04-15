import { Link } from 'react-router-dom'

function TelegramIcon() {
  return (
    <svg className="footerSocialIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.7 4.6 3.9 11.1c-.9.4-.8 1.7.2 1.9l4.6 1.3 1.8 5.6c.3.9 1.6 1 2 .2l2.7-4.9 4.8 3.6c.8.6 2 .2 2.3-.8l2.5-12.3c.3-1.1-.8-2.1-2-1.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 14.3 19.6 6.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="appFooter" aria-label="Футер">
      <div className="appFooterDivider" aria-hidden="true" />

      <div className="appFooterInner">
        <div className="footerDesktop" aria-label="Футер (десктоп)">
          <div className="footerGrid">
            <section className="footerCol" aria-label="Брендинг и право">
              <div className="footerBrandRow">
                <div className="footerLogo" aria-label="Логотип (заглушка)">
                  LOGO
                </div>
                <div className="footerAgeBadge" aria-label="Возрастное ограничение 18+">
                  18+
                </div>
              </div>
              <p className="footerSlogan">«Твое мнение о живом звуке».</p>
              <p className="footerCopyright">© 2026 Название проекта. Все права защищены.</p>
            </section>

            <nav className="footerCol" aria-label="Разделы">
              <h3 className="footerTitle">Разделы</h3>
              <div className="footerLinks">
                <Link to="/concerts" className="footerLink">
                  Концерты
                </Link>
                <Link to="/artists" className="footerLink">
                  Артисты
                </Link>
                <Link to="/venues" className="footerLink">
                  Площадки
                </Link>
                <Link to="/reviews" className="footerLink">
                  Рецензии
                </Link>
              </div>
            </nav>

            <nav className="footerCol" aria-label="Документы">
              <h3 className="footerTitle">Документы</h3>
              <div className="footerLinks">
                <Link to="/terms.html" target="_blank" rel="noreferrer" className="footerLink">
                  Пользовательское соглашение
                </Link>
                <Link to="/privacy.html" target="_blank" rel="noreferrer" className="footerLink">
                  Политика конфиденциальности
                </Link>
                <Link to="/moderation.html" target="_blank" rel="noreferrer" className="footerLink">
                  Правила модерации
                </Link>
              </div>
            </nav>

            <section className="footerCol" aria-label="Связь">
              <h3 className="footerTitle">Связь</h3>
              <div className="footerContact">
                <a className="footerLink" href="mailto:abuse@emount.music">
                  abuse@emount.music
                </a>

                <a
                  className="footerSocialLink"
                  href="https://t.me/emount_music"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Telegram-бот проекта"
                  title="Telegram"
                >
                  <TelegramIcon />
                </a>
              </div>
            </section>
          </div>
        </div>

        <div className="footerMobile" aria-label="Футер (мобильный)">
          <div className="footerMobileLinks" aria-label="Документы">
            <Link to="/terms.html" target="_blank" rel="noreferrer" className="footerLink">
              Соглашение
            </Link>
            <Link to="/privacy.html" target="_blank" rel="noreferrer" className="footerLink">
              Конфиденциальность
            </Link>
            <Link to="/moderation.html" target="_blank" rel="noreferrer" className="footerLink">
              Модерация
            </Link>
          </div>

          <div className="footerMobileMeta" aria-label="Юридическая информация">
            <span className="footerAgeBadge" aria-label="Возрастное ограничение 18+">
              18+
            </span>
            <span className="footerMobileCopy">© 2026 Название проекта</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
