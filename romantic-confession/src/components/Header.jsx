import { HeartIcon, ArrowUpRight } from "./Icons.jsx";

export default function Header({ scrolled }) {
  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <a className="site-brand" href="./index.html" aria-label="Back to our little world">
        <span className="brand-mark" aria-hidden="true">
          <HeartIcon size={17} filled />
        </span>
        <span className="brand-word">for you</span>
      </a>

      <nav className="site-nav" aria-label="Page sections">
        <a href="#chapters">The chapters</a>
        <a href="#letter">The letter</a>
      </nav>

      <a className="header-back" href="./index.html">
        <span className="header-back-label">our little world</span>
        <ArrowUpRight size={14} />
      </a>
    </header>
  );
}
