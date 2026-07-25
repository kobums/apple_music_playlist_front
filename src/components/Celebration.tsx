import { FiCheckCircle } from 'react-icons/fi';
import '../styles/Celebration.css';

/**
 * Completion moment shown once a playlist has actually been saved.
 *
 * design.md → Motion allows richer motion for low-frequency milestone moments,
 * but Icons bans emoji as glyphs, so the 🎉 is replaced by the success icon in a
 * neutral tile. The overlay is inert and announced politely rather than
 * trapping focus.
 */
interface CelebrationProps {
  message: string;
  show: boolean;
}

export default function Celebration({ message, show }: CelebrationProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="celebration" role="status" aria-live="polite">
      <div className="celebration__content">
        <span className="celebration__tile">
          <FiCheckCircle size={32} aria-hidden="true" />
        </span>
        <p className="celebration__message">{message}</p>
      </div>
    </div>
  );
}
