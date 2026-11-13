import { ArrowDown, HeartIcon, PlayIcon, SparkleIcon } from "./Icons.jsx";

export default function Letter() {
  return (
    <section className="letter section" id="letter" aria-labelledby="letter-title">
      <div className="letter-ornament reveal" aria-hidden="true">
        <span />
        <span className="letter-seal">
          <HeartIcon size={20} filled />
        </span>
        <span />
      </div>

      <div className="letter-card reveal">
        <div className="letter-card-glow" aria-hidden="true" />
        <p className="section-kicker">
          <SparkleIcon size={11} />
          one last thing
        </p>
        <h2 id="letter-title" className="letter-title">
          Before you go<span>.</span>
        </h2>

        <div className="letter-copy">
          <p>
            I'm not asking you to feel the same. I only wanted you to know that somewhere
            in this loud, ordinary world, someone thinks the softest things about you.
          </p>
          <p>
            If these eight little chapters made you smile — even once — then this whole
            little universe did its job. Thank you for being someone worth building a
            world for.
          </p>
        </div>

        <p className="letter-signoff">— yours, in every quiet way</p>

        <div className="letter-actions">
          <a className="button button-primary" href="#chapters">
            <PlayIcon size={15} />
            Watch them again
          </a>
          <a className="button button-quiet" href="#top">
            Back to the sky
            <ArrowDown size={14} className="icon-up" />
          </a>
        </div>

        <div className="letter-ps">
          <span className="letter-ps-mark">P.S.</span>
          <p>
            The films have sound. Find a quiet moment, turn the volume up, and let the
            words take their time. This little sky will be here whenever you want to
            come back.
          </p>
        </div>
      </div>
    </section>
  );
}
