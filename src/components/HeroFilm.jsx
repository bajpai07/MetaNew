import { useEffect, useRef, useState } from "react";

/**
 * HERO FILM — a sequence of runway looks, played as a show.
 *
 * Looks play in order and cross-fade into one another, then the sequence
 * begins again. Every look carries the native `loop` attribute, so the browser
 * repeats it for as long as it is on screen — with one look the hero simply
 * never stops, and with several the pass timer moves the show along. An
 * earlier version drove the repeat from JavaScript and the clip could play out
 * and freeze on its last frame; letting the browser do it removes that
 * failure entirely.
 *
 * Loading is staged: only the first look is fetched up front, the rest stay at
 * `preload="none"` until they are warmed, so the opening request is one clip
 * rather than the whole show. Each is muted, inline, and carries no filter,
 * overlay or colour treatment.
 *
 * Reduced motion: no video element is mounted at all. The poster renders as a
 * plain image and nothing moves.
 */

const BASE = process.env.PUBLIC_URL || "";

// Each look is framed twice. A phone crops a 16:9 clip to a narrow upright
// slice, so a position tuned on desktop can walk the model straight out of
// frame — which is exactly what happened before these were split.
const LOOKS = [
  // One look for now. Two others were cut on the client's note that they did
  // not read as fashion — a model who stays distant behind the foreground
  // pampas, and a walk through a field that read as lifestyle. Free stock does
  // not currently offer more runway walks at this standard; the sequencer
  // below handles any number, so adding looks is just more entries here.
  //
  // `start` skips the lead-in, and the framing is set twice because a phone
  // crops a 16:9 clip to a narrow upright slice — a position tuned on desktop
  // can walk the model straight out of frame.
  //
  // The desktop crop is anchored to the top of the frame rather than 38% down.
  // It changes nothing on an ordinary window — at 16:9 or taller the clip is
  // scaled to height and there is no vertical crop to position. It matters only
  // on a wide, short window, where the film is cropped hard: anchoring at the
  // top keeps the clean wall above the model and drops her clear of the
  // masthead, instead of trimming that wall away and lifting her into it.
  { src: BASE + "/media/runway-01.mp4", desktop: "50% 0%", mobile: "45% 48%", start: 3 }
];

const POSTER = BASE + "/media/runway-poster.jpg";

/** How long each look holds the screen before the next model comes through. */
const PASS_MS = 7600;


function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function HeroFilm({ alt }) {
  const refs = useRef([]);
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = function (e) { setReduced(e.matches); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    return function () {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
    };
  }, []);

  // Start fetching the later looks as soon as the first one is under way,
  // rather than at the moment each is needed. They then have a full pass or
  // two of lead time, which is what keeps the change instant.
  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(function () {
      refs.current.forEach(function (el, i) {
        if (i > 0 && el && el.preload !== "auto") {
          el.preload = "auto";
          el.load();
        }
      });
    }, 1200);
    return function () { clearTimeout(timer); };
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;

    const current = refs.current[active];
    if (!current) return;

    // The walks are shot at ordinary speed; a touch slower reads as a house
    // presenting a look rather than a person crossing a room.
    current.playbackRate = 0.85;

    // Seek to the entry point. Setting currentTime before the element can seek
    // is silently ignored, which left every look opening on its own frame zero
    // — the model a speck at the far end of the walk — so if it is not ready
    // yet, wait for data and seek then.
    const seek = function () {
      try { current.currentTime = LOOKS[active].start || 0; } catch (e) {}
    };
    if (current.readyState >= 1) seek();
    else current.addEventListener("loadedmetadata", seek, { once: true });

    const p = current.play();
    if (p && p.catch) p.catch(function () {});

    // Move to the next look that can actually paint. readyState 2 means the
    // first frame is decoded, which is the real bar here — switching to a look
    // below that shows a blank frame, and a blank frame mid-show is worse than
    // holding the model already on screen. If none of the others can paint
    // yet, stay put and try again shortly rather than cutting to nothing.
    let retry = null;
    const advance = function () {
      for (let step = 1; step < LOOKS.length; step++) {
        const i = (active + step) % LOOKS.length;
        const el = refs.current[i];
        if (el && el.readyState >= 2) {
          setActive(i);
          return;
        }
      }
      // Nothing else ready — the current look keeps looping on its own, so
      // just come back and try again rather than touching playback.
      retry = setTimeout(advance, PASS_MS);
    };

    // Each look holds the screen for a set pass rather than playing to the
    // end. Look one alone runs twenty seconds at this rate, far too long to
    // wait before the second model appears — a show moves.
    const hold = setTimeout(advance, PASS_MS);
    return function () {
      clearTimeout(hold);
      if (retry) clearTimeout(retry);
      current.removeEventListener("loadedmetadata", seek);
    };
  }, [active, reduced]);

  if (reduced) {
    return <img className="hero-film" src={POSTER} alt={alt} />;
  }

  return (
    <>
      {LOOKS.map(function (look, i) {
        return (
          <video
            key={look.src}
            ref={function (el) { refs.current[i] = el; }}
            className="hero-film hero-look"
            src={look.src}
            poster={i === 0 ? POSTER : undefined}
            loop
            muted
            playsInline
            preload={i === 0 ? "auto" : "none"}
            aria-hidden="true"
            tabIndex={-1}
            style={{
              opacity: i === active ? 1 : 0,
              "--look-desktop": look.desktop,
              "--look-mobile": look.mobile
            }}
          />
        );
      })}
      <span className="sr-only">{alt}</span>
    </>
  );
}
