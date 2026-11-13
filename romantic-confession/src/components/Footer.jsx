import { HeartIcon } from "./Icons.jsx";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-line" aria-hidden="true" />
      <div className="footer-inner">
        <p className="footer-mark">
          <HeartIcon size={14} filled />
          made with moonlight, moving mountains &amp; a very full heart
        </p>
        <p className="footer-small">Eight little chapters · for you, always</p>
      </div>
    </footer>
  );
}
