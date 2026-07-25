import { useId, useState, type ReactNode } from 'react';
import '../styles/Tooltip.css';

/**
 * components.Tooltip in design.md — inverted short-form helper label, non
 * interactive and keyboard reachable.
 *
 * The old implementation rendered the box on `mouseenter` but also gated it
 * behind a CSS `:hover` rule, so keyboard and touch users could never see it.
 * Visibility is now driven purely by state, the trigger is a real button, and
 * the message is wired to it with `aria-describedby`.
 */
interface TooltipProps {
  message: string;
  /** Accessible name for the trigger, e.g. "제목 입력 도움말". */
  label: string;
  children: ReactNode;
}

export default function Tooltip({ message, label, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  return (
    <span className="tooltip">
      <button
        type="button"
        className="tooltip__trigger"
        aria-label={label}
        aria-describedby={visible ? tooltipId : undefined}
        aria-expanded={visible}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        // Tap, not toggle: on touch there is no hover, and focus already fires
        // first — toggling here would close the tooltip the moment it opened.
        onClick={() => setVisible(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && visible) {
            event.stopPropagation();
            setVisible(false);
          }
        }}
      >
        {children}
      </button>
      {visible ? (
        <span role="tooltip" id={tooltipId} className="tooltip__box">
          {message}
        </span>
      ) : null}
    </span>
  );
}
