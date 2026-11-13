import { useEffect, useRef } from "react";

export default function AmbientBackdrop({ reducedMotion }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      video.pause();
      return;
    }
    video.play().catch(() => {
      /* The poster and 3D world remain if autoplay is unavailable. */
    });
  }, [reducedMotion]);

  return (
    <>
      <div className="backdrop" aria-hidden="true">
        <div className="sky-base" />
        <div className="aurora aurora-one" />
        <div className="aurora aurora-two" />
        <div className="sun-haze" />
        <div className="horizon-wash" />
      </div>

      <div className="meadow-wrap" aria-hidden="true">
        {reducedMotion ? (
          <img className="meadow-film" src="./about-assets/bg/meadow-poster.jpg" alt="" />
        ) : (
          <video
            ref={videoRef}
            className="meadow-film"
            src="./about-assets/bg/meadow.mp4"
            poster="./about-assets/bg/meadow-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            tabIndex={-1}
          />
        )}
        <div className="meadow-wash" />
      </div>

      <div className="light-rays" aria-hidden="true" />
      <div className="sun-bloom" aria-hidden="true" />
    </>
  );
}
