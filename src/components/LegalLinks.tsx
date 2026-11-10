import '../styles/LegalLinks.css';

const TERMS_URL = 'https://gowoobro.com/ko/app/4/terms';
const PRIVACY_URL = 'https://gowoobro.com/ko/app/4/privacy';

/**
 * Terms and privacy policy links, styled as components.link-subtle in
 * design.md. The documents are hosted outside this app, so they open in a new
 * tab.
 */
export default function LegalLinks() {
  return (
    <footer className="legal-links">
      <a className="legal-links__link" href={TERMS_URL} target="_blank" rel="noopener noreferrer">
        이용약관
      </a>
      <span aria-hidden="true">·</span>
      <a className="legal-links__link" href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
        개인정보 처리방침
      </a>
    </footer>
  );
}
