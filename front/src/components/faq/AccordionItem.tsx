import { useId, useState } from 'react'

type AccordionItemProps = {
  question: string
  answer: string
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className="accordionIcon" viewBox="0 0 24 24" aria-hidden="true">
      {open ? (
        <path d="M6 14.5 12 8.5l6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 9.5 12 15.5l6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

export function AccordionItem({ question, answer }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const contentId = useId()

  return (
    <div className="accordionItem">
      <button
        type="button"
        className="accordionBtn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className="accordionQ">{question}</span>
        <Chevron open={isOpen} />
      </button>

      {isOpen ? (
        <div className="accordionBody" id={contentId}>
          <p>{answer}</p>
        </div>
      ) : null}
    </div>
  )
}
