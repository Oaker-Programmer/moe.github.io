import { ArrowDown, PlayIcon, SparkleIcon } from "./Icons.jsx";

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-halo" aria-hidden="true" />

      <div className="hero-inner">
        <div className="hero-kicker hero-reveal" style={{ "--reveal": "120ms" }}>
          <span className="kicker-line" aria-hidden="true" />
          <SparkleIcon size={11} />
          <span>for you, with everything I never said</span>
          <SparkleIcon size={11} />
          <span className="kicker-line" aria-hidden="true" />
        </div>

        <h1 id="hero-title" className="hero-title">
          <span className="hero-title-line hero-reveal" style={{ "--reveal": "240ms" }}>
            Eight little
          </span>
          <span className="hero-title-line hero-title-line-two hero-reveal" style={{ "--reveal": "360ms" }}>
            <em>chapters</em> of you<span className="title-dot">.</span>
          </span>
        </h1>

        <p className="hero-lede hero-reveal" style={{ "--reveal": "500ms" }}>
          I built you a little universe out of moonlight and moving mountains — and hid eight
          pieces of my heart inside it. Press play. Stay as long as you like.
        </p>

        <div className="hero-actions hero-reveal" style={{ "--reveal": "640ms" }}>
          <a className="button button-primary" href="#chapters">
            <PlayIcon size={15} />
            Open the first chapter
          </a>
          <a className="button button-quiet" href="#letter">
            Read my last page
          </a>
        </div>

        <div className="hero-meta hero-reveal" style={{ "--reveal": "760ms" }}>
          <span>08 little films</span>
          <span className="meta-dot" aria-hidden="true" />
          <span>01 very full heart</span>
          <span className="meta-dot" aria-hidden="true" />
          <span>infinitely yours</span>
        </div>
      </div>

      <a className="scroll-cue" href="#chapters" aria-label="Scroll to the eight chapters">
        <span className="scroll-cue-word">scroll to begin</span>
        <span className="scroll-cue-line" aria-hidden="true">
          <span />
        </span>
        <ArrowDown size={14} />
      </a>
    </section>
  );
}
