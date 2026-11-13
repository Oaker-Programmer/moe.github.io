export function PlayIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8.2 5.6c0-.9 1-1.4 1.7-.9l8.4 5.5c.7.5.7 1.5 0 2l-8.4 5.5c-.8.5-1.7 0-1.7-.9V5.6Z" fill="currentColor" />
    </svg>
  );
}

export function PauseIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6.5" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" />
    </svg>
  );
}

export function VolumeIcon({ size = 19, muted = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 9.5h3l4-3.2c.6-.5 1.5-.1 1.5.7v10c0 .8-.9 1.2-1.5.7l-4-3.2h-3c-.6 0-1-.4-1-1v-3.8c0-.6.4-1 1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {muted ? (
        <path d="m16 9.5 5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        <>
          <path d="M16.2 9.2a4 4 0 0 1 0 5.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M18.7 6.8a7.5 7.5 0 0 1 0 10.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".7" />
        </>
      )}
    </svg>
  );
}

export function ExpandIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronLeft({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m14.5 5-7 7 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRight({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9.5 5 7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowDown({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v15m0 0 6-6m-6 6-6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowUpRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeartIcon({ size = 18, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20.3s-7.7-4.6-7.7-10A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.7 3.1c0 5.4-7.7 10-7.7 10Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
        opacity={filled ? 0.9 : 1}
      />
    </svg>
  );
}

export function SparkleIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.5c.5 5.4 4.1 9 9.5 9.5-5.4.5-9 4.1-9.5 9.5-.5-5.4-4.1-9-9.5-9.5 5.4-.5 9-4.1 9.5-9.5Z" fill="currentColor" />
    </svg>
  );
}

export function LoopIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3L20 9.5M20 4.5v5h-5M19.5 12a7.5 7.5 0 0 1-12.8 5.3L4 14.5M4 19.5v-5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
