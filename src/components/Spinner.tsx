/**
 * components.spinner in design.md — stroke-based loader using the tokenised
 * rotate motion rather than a hand-rolled border trick.
 */
interface SpinnerProps {
  /** One of the spinner size steps: 12 / 16 / 24 / 48 / 96. */
  size?: 12 | 16 | 24 | 48 | 96;
  /** Accessible name. Omit for a purely decorative spinner beside visible text. */
  label?: string;
}

export default function Spinner({ size = 24, label }: SpinnerProps) {
  return (
    <svg
      className="spinner"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <circle cx="8" cy="8" r="7" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
