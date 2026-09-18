/**
 * THE MAT — the single most important component in this design system.
 *
 * The problem it solves: every luxury reference this brand is calibrated
 * against (SSENSE, Bottega, The Row) is carried entirely by art-directed
 * photography. Aiyaashi's core feature is the opposite — a customer's own
 * phone photo, in whatever lighting they happened to have. Dropped beside an
 * editorial product grid, a grainy backlit selfie destroys the illusion in one
 * frame.
 *
 * The answer is not to fix the photograph. It is to *present* it. A mediocre
 * print inside a gallery mat reads as chosen, not as bad — the mounting is an
 * assertion of authority. So every customer photograph, in every state
 * (upload preview, processing, result, saved look, modal), is mounted here and
 * nowhere else, identically:
 *
 *   1. the grade    — one warm, slightly desaturated tonal key for all sources
 *   2. the vignette — corners pulled toward ink, eye pushed to the garment
 *   3. the mat      — bone board, 3:4 aperture, deeper bottom margin, caption
 *
 * Merchandise photography deliberately does NOT get the mat. Your photograph is
 * framed; the goods are not. That distinction is the brand.
 */
export default function Plate({
  src,
  alt,
  caption,
  note,
  /** Plays the develop wipe once — the one orchestrated moment on the site. */
  revealing = false,
  /** Holds the photo under a slow passing light band instead of a spinner. */
  processing = false,
  /** 0–1, drawn as a hairline along the foot of the aperture while processing. */
  progress,
  /** 'contain' shows the whole photograph instead of filling the aperture. */
  fit,
  children,
  onClick,
  style
}) {
  return (
    <figure className="mat" style={style} onClick={onClick}>
      <div className={fit === 'contain' ? 'aperture aperture-contain' : 'aperture'}>
        {src && (
          <img
            src={src}
            alt={alt || ''}
            className={`graded${revealing ? ' developing' : ''}${processing ? ' is-processing' : ''}`}
          />
        )}
        {processing && <div className="pass-band" />}
        {processing && typeof progress === 'number' && (
          <div className="plate-progress">
            <span style={{ width: `${Math.max(0.06, Math.min(1, progress)) * 100}%` }} />
          </div>
        )}
        {children}
      </div>

      {(caption || note) && (
        <figcaption className="mat-caption">
          <span>{caption}</span>
          {note && <span>{note}</span>}
        </figcaption>
      )}
    </figure>
  );
}
