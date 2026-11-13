import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, PlayIcon } from "./Icons.jsx";

export default function StoryCard({ story, index, onOpen, finePointer, suspended }) {
  const cardRef = useRef(null);
  const previewTimer = useRef(0);
  const [preview, setPreview] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);

  useEffect(
    () => () => {
      window.clearTimeout(previewTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!suspended) return;
    window.clearTimeout(previewTimer.current);
    setPreview(false);
    setPreviewReady(false);
  }, [suspended]);

  const handlePointerMove = (event) => {
    if (!finePointer || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * 7;
    const rotateY = (x - 0.5) * 8;
    cardRef.current.style.setProperty("--rotate-x", `${rotateX.toFixed(2)}deg`);
    cardRef.current.style.setProperty("--rotate-y", `${rotateY.toFixed(2)}deg`);
    cardRef.current.style.setProperty("--glow-x", `${(x * 100).toFixed(1)}%`);
    cardRef.current.style.setProperty("--glow-y", `${(y * 100).toFixed(1)}%`);
  };

  const resetTilt = () => {
    window.clearTimeout(previewTimer.current);
    setPreview(false);
    setPreviewReady(false);
    if (!cardRef.current) return;
    cardRef.current.style.setProperty("--rotate-x", "0deg");
    cardRef.current.style.setProperty("--rotate-y", "0deg");
    cardRef.current.style.setProperty("--glow-x", "50%");
    cardRef.current.style.setProperty("--glow-y", "35%");
  };

  const handleEnter = () => {
    if (!finePointer || suspended) return;
    window.clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => setPreview(true), 720);
  };

  return (
    <article
      className="story-card-shell reveal"
      style={{ "--reveal-delay": `${(index % 3) * 90}ms` }}
    >
      <button
        ref={cardRef}
        type="button"
        className="story-card"
        onClick={() => onOpen(index)}
        onPointerMove={handlePointerMove}
        onPointerEnter={handleEnter}
        onPointerLeave={resetTilt}
        onBlur={resetTilt}
        aria-label={`Open chapter ${story.number}: ${story.title}`}
      >
        <span className="story-media">
          <img
            className="story-poster"
            src={story.poster}
            alt=""
            loading={index < 2 ? "eager" : "lazy"}
            decoding="async"
            style={{ objectPosition: story.posterPosition }}
          />
          {preview && (
            <video
              className={`story-preview ${previewReady ? "is-ready" : ""}`}
              src={story.src}
              muted
              loop
              playsInline
              autoPlay
              preload="none"
              aria-hidden="true"
              tabIndex={-1}
              onCanPlay={() => setPreviewReady(true)}
            />
          )}
          <span className="story-shade" aria-hidden="true" />
          <span className="story-glow" aria-hidden="true" />

          <span className="story-topline">
            <span className="story-number">Chapter {story.number}</span>
            <span className="story-duration">{story.duration}</span>
          </span>

          <span className="story-play" aria-hidden="true">
            <span className="story-play-ring" />
            <span className="story-play-core">
              <PlayIcon size={22} />
            </span>
          </span>

          <span className="story-hover-hint" aria-hidden="true">
            play this moment
          </span>
        </span>

        <span className="story-body">
          <span className="story-mood">{story.mood}</span>
          <span className="story-title">{story.title}</span>
          <span className="story-quote">“{story.quote}”</span>
          <span className="story-open">
            open chapter
            <ArrowUpRight size={14} />
          </span>
        </span>
      </button>
    </article>
  );
}
