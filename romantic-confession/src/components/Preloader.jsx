import { useEffect, useRef, useState } from "react";

export default function Preloader({ ready }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(true);
  const readyRef = useRef(ready);
  readyRef.current = ready;

  useEffect(() => {
    const started = performance.now();
    let finished = false;
    const timer = window.setInterval(() => {
      if (finished) return;
      const elapsed = performance.now() - started;
      const timed = Math.min(100, (elapsed / 900) * 100);
      const value = readyRef.current ? timed : Math.min(90, timed);
      setProgress(value);

      if ((readyRef.current && elapsed >= 800) || elapsed >= 2200) {
        finished = true;
        setProgress(100);
        window.clearInterval(timer);
        window.setTimeout(() => setDone(true), 260);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!done) return undefined;
    const timer = window.setTimeout(() => setMounted(false), 700);
    return () => window.clearTimeout(timer);
  }, [done]);

  if (!mounted) return null;

  return (
    <div className={`preloader ${done ? "is-done" : ""}`} role="status" aria-live="polite">
      <div className="preloader-inner">
        <div className="preloader-mark" aria-hidden="true">
          <span className="preloader-ring" />
          <span className="preloader-heart">♡</span>
        </div>
        <p className="preloader-kicker">a private little world</p>
        <p className="preloader-line">Gathering eight little moments</p>
        <div className="preloader-bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${Math.max(0.03, progress / 100)})` }} />
        </div>
        <span className="preloader-percent">{String(Math.round(progress)).padStart(2, "0")}%</span>
      </div>
    </div>
  );
}
