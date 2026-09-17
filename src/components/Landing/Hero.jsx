import BackgroundVideo from "./BackgroundVideo.jsx";
import { siteConfig } from "../../config/siteConfig.js";

export default function Hero() {
  const handleExplore = () => {
    document
      .getElementById("pc-cards")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="pc-hero">
      <BackgroundVideo />

      <div className="pc-hero__content">
        <div className="pc-hero__presenter">
          <span className="pc-hero__presenter-name">{siteConfig.presenter}</span>
          <span className="pc-hero__presenter-sub">PRESENTS</span>
        </div>

        <h1 className="pc-hero__title">
          {siteConfig.title} <span className="pc-hero__bolt">{siteConfig.bolt}</span>
        </h1>

        <h2 className="pc-hero__hook">
          {siteConfig.heroHook} <span className="pc-hero__bolt">{siteConfig.bolt}</span>
        </h2>

        <p className="pc-hero__subtitle">
          {siteConfig.heroDescriptionLines.map((line, i) => (
            <span key={i} className="pc-hero__subtitle-line">
              {line}
            </span>
          ))}
        </p>

        <button type="button" className="pc-hero__scroll" onClick={handleExplore}>
          <span>EXPLORE</span>
          <span className="pc-hero__scroll-arrow" aria-hidden="true">↓</span>
        </button>
      </div>
    </section>
  );
}
