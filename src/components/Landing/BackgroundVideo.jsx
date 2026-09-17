import { useEffect, useRef, useState } from "react";
import { siteConfig } from "../../config/siteConfig.js";

export default function BackgroundVideo() {
  const videoRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
  const [autoplayFailed, setAutoplayFailed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const video = videoRef.current;
    if (!video) return;
    const playPromise = video.play();
    if (playPromise?.catch) {
      playPromise.catch(() => setAutoplayFailed(true));
    }
  }, [reducedMotion]);

  const showPosterOnly = reducedMotion || autoplayFailed;

  return (
    <div className="pc-bgvideo" aria-hidden="true">
      {!showPosterOnly && (
        <video
          ref={videoRef}
          className="pc-bgvideo__el"
          src={siteConfig.video.src}
          poster={siteConfig.video.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      )}
      {showPosterOnly && (
        <img
          className="pc-bgvideo__el pc-bgvideo__poster"
          src={siteConfig.video.poster}
          alt=""
          aria-hidden="true"
        />
      )}
      <div className="pc-bgvideo__overlay" />
      <div className="pc-bgvideo__grain" />
    </div>
  );
}
