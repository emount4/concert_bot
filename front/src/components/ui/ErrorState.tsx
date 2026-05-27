import { Link, useNavigate } from 'react-router-dom'

type ErrorStateAction = {
  label: string
  to?: string
  onClick?: () => void
  variant?: 'primary' | 'ghost'
}

type ErrorStateProps = {
  code?: string
  title: string
  text?: string
  actions?: ErrorStateAction[]
}

export function ErrorState({ code, title, text, actions }: ErrorStateProps) {
  const navigate = useNavigate()
  const visibleActions = actions ?? [
    { label: 'На главную', to: '/home', variant: 'primary' },
    { label: 'Назад', onClick: () => navigate(-1), variant: 'ghost' },
  ]

  return (
    <div className="errorState" role="status">
      {code && <p className="errorStateCode">{code}</p>}
      <div className="errorStateMark" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path
            d="M12 8.2v4.6M12 16.8h.01M10.2 4.8 3.4 17a2 2 0 0 0 1.8 2.9h13.6a2 2 0 0 0 1.8-2.9L13.8 4.8a2 2 0 0 0-3.6 0Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="errorStateTitle">{title}</h2>
      {text && <p className="errorStateText">{text}</p>}
      {visibleActions.length > 0 && (
        <div className="errorStateActions">
          {visibleActions.map((action) =>
            action.to ? (
              <Link
                key={`${action.label}-${action.to}`}
                to={action.to}
                className={action.variant === 'ghost' ? 'settingsBtn ghost' : 'settingsBtn primary'}
              >
                {action.label}
              </Link>
            ) : (
              <button
                key={action.label}
                type="button"
                className={action.variant === 'ghost' ? 'settingsBtn ghost' : 'settingsBtn primary'}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
