export function AboutPage() {
  return (
    <section className="page infoPage" aria-label="О проекте">
      <div className="infoPageInner">
        <h1 className="pageTitle">О проекте</h1>

        <section className="infoSection" aria-label="Общая информация">
          <h2 className="infoSectionTitle">Общая информация</h2>
          <p className="infoText">
            Данная платформа является курсовым проектом студента второго курса emount. Это независимая разработка,
            созданная в рамках обучения и профессионального развития.
          </p>
          <p className="infoText">
            Проект не является коммерческим стартапом и не преследует извлечение прибыли, однако в его реализацию вложен
            значительный объем личных усилий и стремление к качественному исполнению.
          </p>
        </section>

        <section className="infoSection" aria-label="Методология оценки">
          <h2 className="infoSectionTitle">Методология оценки</h2>
          <blockquote className="infoQuote">
            Идеологическим фундаментом системы оценок послужил проект «Риса за творчество». Пятипараметрическая шкала
            рейтинга является осознанной пародией и данью уважения оригинальной системе, адаптированной под специфику
            живых концертных выступлений. Автор выражает благодарность проекту-вдохновителю за предложенный вектор
            анализа музыкального контента.
          </blockquote>
        </section>

        <section className="infoSection" aria-label="Разработка и стек">
          <h2 className="infoSectionTitle">Разработка и стек</h2>
          <p className="infoText">
            Весь цикл разработки — от проектирования архитектуры базы данных до реализации пользовательского интерфейса —
            выполнен одним человеком.
          </p>

          <div className="infoSubTitle">Технологический стек</div>
          <ul className="infoList" aria-label="Технологический стек проекта">
            <li>
              <strong>Backend:</strong> Go (Golang) — высокая производительность и надежность.
            </li>
            <li>
              <strong>Frontend:</strong> React — современный декларативный интерфейс.
            </li>
            <li>
              <strong>Data:</strong> PostgreSQL, Redis, Minio (S3).
            </li>
          </ul>
        </section>

        <section className="infoSection" aria-label="Цель и механика">
          <h2 className="infoSectionTitle">Цель и механика</h2>
          <p className="infoText">
            Основная цель проекта — создать инструмент для структурированного фидбека. Система переводит субъективные
            впечатления зрителя в объективные данные с помощью математической формулы.
          </p>
          <p className="infoText">
            Каждый параметр оценки (<span className="infoInlineCode">Звук</span>, <span className="infoInlineCode">Свет</span>,{' '}
            <span className="infoInlineCode">Исполнение</span>, <span className="infoInlineCode">Атмосфера</span>,{' '}
            <span className="infoInlineCode">Организация</span>) вносит свой вклад в итоговый рейтинг, формируя прозрачную
            карту качества концертных событий.
          </p>
        </section>

        <section className="infoSection" aria-label="Заключение">
          <h2 className="infoSectionTitle">Заключение</h2>
          <p className="infoText">
            Проект находится в стадии активного развития и поддерживается автором на энтузиазме. Если вы обнаружили
            техническую ошибку или имеете предложения по улучшению функционала, вы можете связаться со мной напрямую через
            указанные контакты.
          </p>
        </section>
      </div>
    </section>
  )
}
