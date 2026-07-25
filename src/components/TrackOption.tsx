import { FiMusic, FiPause, FiPlay } from 'react-icons/fi';
import type { Track } from '../lib/api';
import '../styles/TrackOption.css';

/**
 * One candidate recording, selectable as a radio option.
 *
 * Artwork and the 30-second preview come from the same search response the app
 * already fetched, and they are what make a choice possible: for a title several
 * artists share, the cover art and the first seconds of audio settle it far
 * faster than reading names.
 */
interface TrackOptionProps {
  track: Track;
  name: string;
  selected: boolean;
  onSelect: () => void;
  isPlaying: boolean;
  onTogglePreview: () => void;
}

export default function TrackOption({
  track,
  name,
  selected,
  onSelect,
  isPlaying,
  onTogglePreview,
}: TrackOptionProps) {
  return (
    <label className={`track-option ${selected ? 'track-option--selected' : ''}`}>
      <input
        type="radio"
        className="track-option__radio"
        name={name}
        checked={selected}
        onChange={onSelect}
      />

      {track.artworkUrl ? (
        <img className="track-option__art" src={track.artworkUrl} alt="" width={48} height={48} />
      ) : (
        <span className="track-option__art track-option__art--empty">
          <FiMusic size={16} aria-hidden="true" />
        </span>
      )}

      <span className="track-option__text">
        <span className="track-option__title">{track.name}</span>
        <span className="track-option__meta">
          {track.artistName}
          {track.albumName ? ` · ${track.albumName}` : ''}
        </span>
      </span>

      {track.previewUrl ? (
        <button
          type="button"
          className="track-option__preview"
          aria-label={`${track.artistName} - ${track.name} 미리듣기`}
          aria-pressed={isPlaying}
          // Keeps a click on the play button from also selecting the option.
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onTogglePreview();
          }}
        >
          {isPlaying ? <FiPause size={16} /> : <FiPlay size={16} />}
        </button>
      ) : null}
    </label>
  );
}
