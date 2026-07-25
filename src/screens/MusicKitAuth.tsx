import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { fetchDeveloperToken } from '../lib/api';
import { configureMusicKit } from '../lib/musickit';
import SectionMessage from '../components/SectionMessage';
import Spinner from '../components/Spinner';
import '../styles/MusicKitAuth.css';

type Status = 'preparing' | 'ready' | 'error';

/**
 * Splits text into per-character spans so the welcome line can stagger in. The
 * spans are hidden from assistive tech; a single visually-hidden string carries
 * the real heading text.
 */
function AnimatedText({ text, startDelayMs = 0 }: { text: string; startDelayMs?: number }) {
  return (
    <>
      {Array.from(text).map((char, index) => (
        <span
          key={`${index}-${char}`}
          className="welcome__char"
          style={
            {
              '--char-index': index,
              '--char-start': `${startDelayMs}ms`,
            } as CSSProperties
          }
          aria-hidden="true"
        >
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </>
  );
}

export default function MusicKitAuth() {
  const navigate = useNavigate();
  // Set when an expired session bounced the user back here, so they see why
  // they are being asked to sign in again.
  const { setDeveloperToken, setMusicUserToken, signedOutReason } = useAuth();

  const [status, setStatus] = useState<Status>('preparing');
  const [error, setError] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const instanceRef = useRef<MusicKit.MusicKitInstance | null>(null);

  const prepare = useCallback(
    async (isCancelled: () => boolean) => {
      setStatus('preparing');
      setError(null);
      try {
        const developerToken = await fetchDeveloperToken();
        const instance = await configureMusicKit(developerToken);
        if (isCancelled()) {
          return;
        }
        instanceRef.current = instance;
        setDeveloperToken(developerToken);
        setStatus('ready');
      } catch (cause) {
        if (isCancelled()) {
          return;
        }
        setError(cause instanceof Error ? cause.message : 'Apple Music을 준비하지 못했습니다.');
        setStatus('error');
      }
    },
    [setDeveloperToken],
  );

  useEffect(() => {
    let cancelled = false;
    void prepare(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [prepare]);

  const authorize = async () => {
    const instance = instanceRef.current;
    if (!instance) {
      return;
    }

    setIsAuthorizing(true);
    setError(null);
    try {
      const musicUserToken = await instance.authorize();
      if (!musicUserToken) {
        throw new Error('Apple Music 계정 인증이 끝나지 않았습니다. 다시 시도해 주세요.');
      }
      setMusicUserToken(musicUserToken);
      navigate('/playlist', { replace: true });
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : 'Apple Music 계정 인증에 실패했습니다. 팝업 차단을 해제하고 다시 시도해 주세요.',
      );
      setIsAuthorizing(false);
    }
  };

  const buttonLabel = isAuthorizing
    ? '인증 중'
    : status === 'preparing'
      ? 'Apple Music 준비 중'
      : 'Apple Music 인증하기';

  return (
    <main className="auth">
      <div className="auth__content">
        <h1 className="welcome">
          <span className="visually-hidden">Welcome. Create your Apple Music playlist</span>
          <span className="welcome__line">
            <AnimatedText text="Welcome" />
          </span>
          <span className="welcome__line welcome__line--secondary">
            <AnimatedText text="Create your Apple Music playlist" startDelayMs={600} />
          </span>
        </h1>

        {/* Shown alongside any connection error, not instead of it: the notice
            explains why the user was sent back here, the error explains what is
            failing right now. Hiding one behind the other loses a fact. */}
        {signedOutReason ? (
          <SectionMessage appearance="information" title="다시 로그인해 주세요">
            {signedOutReason}
          </SectionMessage>
        ) : null}

        {error ? (
          <SectionMessage appearance="error" title="Apple Music에 연결하지 못했습니다">
            {error}
          </SectionMessage>
        ) : null}

        <div className="auth__actions">
          {status === 'error' ? (
            <button type="button" className="btn" onClick={() => void prepare(() => false)}>
              다시 시도
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void authorize()}
              disabled={status !== 'ready' || isAuthorizing}
            >
              {status === 'preparing' || isAuthorizing ? <Spinner size={16} /> : null}
              {buttonLabel}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
