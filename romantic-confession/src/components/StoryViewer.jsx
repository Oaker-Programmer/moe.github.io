import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useBodyLock } from "../hooks/useExperience.js";
import {
  ChevronLeft,
  ChevronRight,
  ExpandIcon,
  LoopIcon,
  PauseIcon,
  PlayIcon,
  VolumeIcon,
} from "./Icons.jsx";

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function RevealedParagraph({ text, paragraphIndex }) {
  const words = text.split(" ");
  return (
    <p>
      {words.map((word, index) => (
        <span
          className="reveal-word"
          key={`${paragraphIndex}-${index}`}
          style={{ "--word-delay": `${paragraphIndex * 130 + index * 22}ms` }}
        >
          {word}
          {index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}

export default function StoryViewer({ stories, activeIndex, onClose, onNavigate, reducedMotion }) {
  const isOpen = activeIndex !== null;
  const story = isOpen ? stories[activeIndex] : null;

  const videoRef = useRef(null);
  const shellRef = useRef(null);
  const dialogRef = useRef(null);
  const mutedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [soundHint, setSoundHint] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useBodyLock(isOpen);

  useEffect(() => {
    mutedRef.current = muted;
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted, activeIndex]);

  /* Start the correct film whenever the selected chapter changes. The video
     element is keyed by chapter id, and this effect always plays that exact
     element, so audio and story text can never drift apart. */
  useEffect(() => {
    if (activeIndex === null) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;

    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBuffering(true);
    setSoundHint(false);
    video.currentTime = 0;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      video.muted = mutedRef.current;
      try {
        await video.play();
        if (!cancelled) {
          setPlaying(true);
          setBuffering(false);
          if (video.muted) setSoundHint(true);
        }
      } catch {
        video.muted = true;
        if (!cancelled) setMuted(true);
        try {
          await video.play();
          if (!cancelled) {
            setPlaying(true);
            setBuffering(false);
            setSoundHint(true);
          }
        } catch {
          if (!cancelled) {
            setPlaying(false);
            setBuffering(false);
          }
        }
      }
    }, 60);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      video.pause();
    };
  }, [activeIndex]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = window.setTimeout(() => dialogRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      const tag = event.target?.tagName;
      const isFormField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusables = Array.from(
          dialog.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => element.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (isFormField) return;

      if (event.key === " " || event.key === "k") {
        event.preventDefault();
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onNavigate((activeIndex + 1) % stories.length);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onNavigate((activeIndex - 1 + stories.length) % stories.length);
      } else if (event.key === "m" || event.key === "M") {
        setMuted((value) => !value);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, activeIndex, onClose, onNavigate, stories.length]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const mediaAspect = useMemo(() => {
    if (!story) return "16 / 9";
    return story.aspect;
  }, [story]);

  if (!isOpen || !story) return null;

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const unmute = () => {
    const video = videoRef.current;
    setMuted(false);
    setSoundHint(false);
    if (video) {
      video.muted = false;
      video.play().catch(() => {});
    }
  };

  const toggleFullscreen = async () => {
    const shell = shellRef.current;
    const video = videoRef.current;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (shell?.requestFullscreen) {
        await shell.requestFullscreen();
      } else if (video?.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    } catch {
      /* Some mobile browsers do not expose fullscreen; the viewer still works. */
    }
  };

  const seek = (event) => {
    const video = videoRef.current;
    const value = Number(event.target.value);
    if (!video || !Number.isFinite(value)) return;
    video.currentTime = value;
    setCurrentTime(value);
  };

  const previous = (activeIndex - 1 + stories.length) % stories.length;
  const next = (activeIndex + 1) % stories.length;

  return createPortal(
    <div
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewer-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="viewer-atmosphere"
        aria-hidden="true"
        style={{ backgroundImage: `url(${story.poster})` }}
      />
      <div className="viewer-veil" aria-hidden="true" />

      <div className="viewer-dialog" ref={dialogRef} tabIndex={-1}>
        <header className="viewer-topbar">
          <button className="viewer-back" type="button" onClick={onClose}>
            <ChevronLeft size={18} />
            <span>close</span>
          </button>

          <p className="viewer-now">
            <span className="viewer-now-dot" aria-hidden="true" />
            now playing
            <span className="viewer-now-separator" aria-hidden="true" />
            <span className="viewer-now-title">{story.title}</span>
          </p>

          <span className="viewer-count">
            {story.number} <span aria-hidden="true">/</span>{" "}
            {String(stories.length).padStart(2, "0")}
          </span>
        </header>

        <div className="viewer-scroll">
          <div className="viewer-stage">
            <div className="viewer-film">
              <div className="video-shell" ref={shellRef}>
                <div className="video-glow" aria-hidden="true" />
                <div className={`video-frame ${buffering ? "is-buffering" : ""}`}>
                  <video
                    key={story.id}
                    ref={videoRef}
                    className="video-el"
                    src={story.src}
                    poster={story.poster}
                    loop
                    playsInline
                    autoPlay
                    preload="auto"
                    aria-label={`${story.title} — chapter ${story.number}`}
                    style={{ "--media-aspect": mediaAspect }}
                    onLoadedMetadata={(event) => {
                      const video = event.currentTarget;
                      setDuration(video.duration || 0);
                      const width = video.videoWidth;
                      const height = video.videoHeight;
                      if (width && height) {
                        event.currentTarget.style.setProperty(
                          "--media-aspect",
                          `${width} / ${height}`,
                        );
                      }
                    }}
                    onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onWaiting={() => setBuffering(true)}
                    onPlaying={() => setBuffering(false)}
                    onCanPlay={() => setBuffering(false)}
                    onEnded={(event) => {
                      event.currentTarget.currentTime = 0;
                      event.currentTarget.play().catch(() => {});
                    }}
                    onError={() => setBuffering(false)}
                  />

                  {!playing && !buffering && (
                    <button className="video-big-play" type="button" onClick={togglePlay} aria-label="Play this chapter">
                      <PlayIcon size={30} />
                    </button>
                  )}

                  {buffering && (
                    <div className="video-buffering" aria-hidden="true">
                      <span className="buffering-ring" />
                    </div>
                  )}

                  <div className="video-topbadges">
                    <span className="video-loop">
                      <LoopIcon size={13} />
                      looping
                    </span>
                    <span className="video-chapter">chapter {story.number}</span>
                  </div>

                  {soundHint && muted && (
                    <button className="sound-hint" type="button" onClick={unmute}>
                      <VolumeIcon size={16} muted />
                      tap for sound
                    </button>
                  )}

                  <div className="video-bottomshade" aria-hidden="true" />
                </div>

                <div className="video-controls">
                  <div className="video-progress-row">
                    <input
                      className="video-progress"
                      type="range"
                      min="0"
                      max={duration || 0.01}
                      step="0.01"
                      value={Math.min(currentTime, duration || 0)}
                      onChange={seek}
                      aria-label="Video progress"
                      style={{
                        "--progress": `${duration ? Math.min(100, (currentTime / duration) * 100) : 0}%`,
                      }}
                    />
                  </div>

                  <div className="video-controls-row">
                    <div className="video-controls-left">
                      <button
                        className="control-button control-button-main"
                        type="button"
                        onClick={togglePlay}
                        aria-label={playing ? "Pause video" : "Play video"}
                      >
                        {playing ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
                      </button>
                      <button
                        className="control-button"
                        type="button"
                        onClick={() => setMuted((value) => !value)}
                        aria-label={muted ? "Unmute video" : "Mute video"}
                      >
                        <VolumeIcon size={18} muted={muted} />
                      </button>
                      <span className="video-time">
                        {formatTime(currentTime)}
                        <span aria-hidden="true"> / </span>
                        {formatTime(duration)}
                      </span>
                    </div>

                    <div className="video-controls-right">
                      <span className="video-loop-label">
                        <LoopIcon size={13} />
                        infinite loop
                      </span>
                      <button
                        className="control-button"
                        type="button"
                        onClick={toggleFullscreen}
                        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                      >
                        <ExpandIcon size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="message-panel" key={story.id}>
              <div className="message-panel-inner">
                <div className="message-topline">
                  <p className="message-chapter">
                    chapter {story.number}
                    <span aria-hidden="true">·</span>
                    {story.mood}
                  </p>
                  <span className="message-script">for you</span>
                </div>

                <h2 className="message-title" id="viewer-title">
                  {story.title}
                </h2>
                <p className="message-quote">“{story.quote}”</p>

                <div className="message-divider" aria-hidden="true">
                  <span />
                </div>

                <div className="message-copy">
                  {story.message.map((paragraph, index) => (
                    <RevealedParagraph
                      key={`${story.id}-${index}`}
                      text={paragraph}
                      paragraphIndex={index}
                    />
                  ))}
                </div>

                <p className="message-whisper">{story.whisper}</p>

                <div className="viewer-nav">
                  <button className="viewer-nav-button" type="button" onClick={() => onNavigate(previous)}>
                    <ChevronLeft size={16} />
                    <span className="viewer-nav-label">
                      <span>previous</span>
                      <strong>{stories[previous].title}</strong>
                    </span>
                  </button>
                  <button className="viewer-nav-button viewer-nav-button-next" type="button" onClick={() => onNavigate(next)}>
                    <span className="viewer-nav-label">
                      <span>next</span>
                      <strong>{stories[next].title}</strong>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
