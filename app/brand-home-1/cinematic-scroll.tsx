"use client";

import { useCallback, useEffect, useRef } from "react";

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const smooth = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

export default function CinematicScroll() {
  const rootRef = useRef<HTMLElement>(null);
  const sceneRefs = useRef<Array<HTMLDivElement | null>>([]);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const copyRefs = useRef<Array<HTMLElement | null>>([]);
  const dotRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const progressRef = useRef<HTMLSpanElement>(null);

  const jumpToScene = useCallback((index: number) => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const travel = Math.max(1, root.offsetHeight - window.innerHeight);
    const rootTop = window.scrollY + root.getBoundingClientRect().top;
    window.scrollTo({
      top: rootTop + travel * (index === 0 ? 0.08 : 0.78),
      behavior: reduced ? "auto" : "smooth",
    });
  }, []);

  const openBooking = useCallback(() => {
    document
      .querySelector<HTMLButtonElement>(".me-scroll-lab-content .me-book-link")
      ?.click();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const controller = new AbortController();
    const objectUrls: string[] = [];
    let animationFrame = 0;
    let disposed = false;

    const videos = videoRefs.current.filter(
      (video): video is HTMLVideoElement => Boolean(video),
    );

    if (!reduced) {
      const sources = [
        "/brand-home-1/scroll-film/leg-01.mp4",
        "/brand-home-1/scroll-film/leg-02.mp4",
      ];

      sources.forEach(async (source, index) => {
        const video = videos[index];
        if (!video) return;
        try {
          const response = await fetch(source, { signal: controller.signal });
          if (!response.ok) throw new Error(`Unable to load ${source}`);
          const url = URL.createObjectURL(await response.blob());
          if (disposed) {
            URL.revokeObjectURL(url);
            return;
          }
          objectUrls.push(url);
          video.src = url;
          video.load();
          video.addEventListener(
            "loadeddata",
            () => {
              try {
                video.currentTime = 0.001;
              } catch {
                // The poster remains visible until the decoder accepts a seek.
              }
            },
            { once: true },
          );
          video.addEventListener(
            "seeked",
            () => sceneRefs.current[index]?.classList.add("has-video-frame"),
            { once: true },
          );
        } catch (error) {
          if (!controller.signal.aborted) console.error(error);
        }
      });
    }

    const seek = (video: HTMLVideoElement | undefined, value: number) => {
      if (!video || video.readyState < 1 || video.seeking) return;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      if (!duration) return;
      const target = clamp(value, 0, 0.998) * duration;
      const threshold = mobile ? 0.025 : 0.009;
      if (Math.abs(video.currentTime - target) > threshold) {
        try {
          video.currentTime = target;
        } catch {
          // A later scroll frame will retry once the decoder is seekable.
        }
      }
    };

    const render = () => {
      animationFrame = 0;
      const travel = Math.max(1, root.offsetHeight - window.innerHeight);
      const progress = clamp(-root.getBoundingClientRect().top / travel);
      const blend = smooth((progress - 0.465) / 0.07);

      const sceneOne = sceneRefs.current[0];
      const sceneTwo = sceneRefs.current[1];
      if (sceneOne) sceneOne.style.opacity = String(1 - blend);
      if (sceneTwo) sceneTwo.style.opacity = String(blend);

      seek(videos[0], progress / 0.5);
      seek(videos[1], (progress - 0.5) / 0.5);

      const firstCopyOpacity = smooth(1 - (progress - 0.08) / 0.28);
      const finalCopyOpacity = smooth((progress - 0.56) / 0.24);
      const copyOne = copyRefs.current[0];
      const copyTwo = copyRefs.current[1];
      if (copyOne) {
        copyOne.style.opacity = String(firstCopyOpacity);
        copyOne.style.transform = `translate3d(0, ${(0.18 - progress) * 34}px, 0)`;
        copyOne.style.pointerEvents = firstCopyOpacity > 0.55 ? "auto" : "none";
      }
      if (copyTwo) {
        copyTwo.style.opacity = String(finalCopyOpacity);
        copyTwo.style.transform = `translate3d(0, ${(0.78 - progress) * 34}px, 0)`;
        copyTwo.style.pointerEvents = finalCopyOpacity > 0.55 ? "auto" : "none";
      }

      dotRefs.current.forEach((dot, index) =>
        dot?.classList.toggle("is-active", index === (progress < 0.52 ? 0 : 1)),
      );
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`;
      }
      root.style.setProperty("--me-lab-progress", progress.toFixed(4));
    };

    const schedule = () => {
      if (!animationFrame) animationFrame = requestAnimationFrame(render);
    };

    const primeVideos = () => {
      if (!mobile) return;
      videos.forEach((video) => {
        const promise = video.play();
        promise?.then(() => video.pause()).catch(() => undefined);
      });
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("pointerdown", primeVideos, { once: true, passive: true });
    render();

    return () => {
      disposed = true;
      controller.abort();
      if (animationFrame) cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pointerdown", primeVideos);
      videos.forEach((video) => {
        video.removeAttribute("src");
        video.load();
      });
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <section
      className="me-lab-scroll"
      ref={rootRef}
      aria-label="Scroll through the Maison Élan atelier"
    >
      <div className="me-lab-sticky">
        <div className="me-lab-scenes" aria-hidden="true">
          <div
            className="me-lab-scene is-first"
            ref={(node) => {
              sceneRefs.current[0] = node;
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-home-1/scroll-film/arrival-poster.jpg" alt="" />
            <video
              ref={(node) => {
                videoRefs.current[0] = node;
              }}
              muted
              playsInline
              preload="none"
              poster="/brand-home-1/scroll-film/arrival-poster.jpg"
            />
          </div>
          <div
            className="me-lab-scene is-second"
            ref={(node) => {
              sceneRefs.current[1] = node;
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-home-1/scroll-film/ritual-poster.jpg" alt="" />
            <video
              ref={(node) => {
                videoRefs.current[1] = node;
              }}
              muted
              playsInline
              preload="none"
              poster="/brand-home-1/scroll-film/ritual-poster.jpg"
            />
          </div>
        </div>

        <div className="me-lab-vignette" aria-hidden="true" />
        <div className="me-lab-grain" aria-hidden="true" />

        <div className="me-lab-copy-layer">
          <article
            className="me-lab-copy is-arrival"
            ref={(node) => {
              copyRefs.current[0] = node;
            }}
          >
            <span className="me-lab-index">01 / Enter the atelier</span>
            <p className="me-lab-kicker">A private hair maison</p>
            <h1>The ritual begins before the chair.</h1>
            <p>
              Move through a quieter kind of salon—designed around attention,
              material warmth and time that never feels rushed.
            </p>
            <button className="me-lab-text-link" onClick={() => jumpToScene(1)}>
              Scroll into the maison <i aria-hidden="true">↓</i>
            </button>
          </article>

          <article
            className="me-lab-copy is-ritual"
            ref={(node) => {
              copyRefs.current[1] = node;
            }}
          >
            <span className="me-lab-index">02 / Your private ritual</span>
            <p className="me-lab-kicker">The chair is yours</p>
            <h2>Arrive where care becomes ritual.</h2>
            <p>
              Precision, intuition and an unhurried finish—shaped around the
              person who sits here.
            </p>
            <div className="me-lab-actions">
              <button className="me-lab-primary" onClick={openBooking}>
                Reserve your chair <span aria-hidden="true">→</span>
              </button>
              <a href="#ritual">Explore the maison</a>
            </div>
          </article>
        </div>

        <nav className="me-lab-route" aria-label="Cinematic chapters">
          {["Arrival", "Ritual"].map((label, index) => (
            <button
              key={label}
              className={index === 0 ? "is-active" : ""}
              ref={(node) => {
                dotRefs.current[index] = node;
              }}
              onClick={() => jumpToScene(index)}
              aria-label={`Go to ${label}`}
            >
              <span>{label}</span><i />
            </button>
          ))}
        </nav>

        <div className="me-lab-scroll-hint" aria-hidden="true">
          <span>Scroll to enter</span><i><b /></i>
        </div>
        <div className="me-lab-progress" aria-hidden="true"><span ref={progressRef} /></div>
      </div>
    </section>
  );
}
