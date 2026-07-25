import type { ReactNode } from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';

/**
 * components.SectionMessage in design.md — page-level status notice. Meaning is
 * carried by the semantic background plus the role icon; the body copy stays in
 * neutral `text`, never tinted to match the panel.
 */
type Appearance = 'information' | 'error' | 'success';

const ICONS = {
  information: FiInfo,
  error: FiAlertCircle,
  success: FiCheckCircle,
} as const;

interface SectionMessageProps {
  appearance?: Appearance;
  title?: string;
  children: ReactNode;
}

export default function SectionMessage({
  appearance = 'information',
  title,
  children,
}: SectionMessageProps) {
  const Icon = ICONS[appearance];

  return (
    <div
      className={`section-message section-message--${appearance}`}
      role={appearance === 'error' ? 'alert' : 'status'}
    >
      <Icon className="section-message__icon" size={16} aria-hidden="true" />
      <div>
        {title ? <p className="section-message__title">{title}</p> : null}
        <p className="section-message__body">{children}</p>
      </div>
    </div>
  );
}
