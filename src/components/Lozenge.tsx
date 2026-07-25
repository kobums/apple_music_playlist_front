import type { ReactNode } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

/**
 * components.lozenge in design.md — semantic status, always with a visible 1px
 * border and an icon so the state does not rely on colour alone.
 */
type Appearance = 'default' | 'success' | 'danger';

const ICONS = {
  default: null,
  success: FiCheck,
  danger: FiX,
} as const;

interface LozengeProps {
  appearance?: Appearance;
  children: ReactNode;
}

export default function Lozenge({ appearance = 'default', children }: LozengeProps) {
  const Icon = ICONS[appearance];

  return (
    <span className={`lozenge lozenge--${appearance}`}>
      {Icon ? <Icon className="lozenge__icon" size={12} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
