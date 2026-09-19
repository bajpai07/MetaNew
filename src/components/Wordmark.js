/**
 * AIYAASI — the logotype.
 *
 * Two treatments, because one setting cannot serve both jobs:
 *
 *   compact (default)  chrome — navbar, drawer, back office.
 *                      16px, weight 700, 0.10em, optical size pinned to 8.
 *
 *   display            hero and splash, where the name has room.
 *                      Weight 500, 0.34em, trailing letterspace trimmed so
 *                      the mark optically aligns to the edge it sits on.
 *
 * The wide-tracked setting is the brand's voice, but it only works large.
 * Shrunk into a 60px navbar it stopped reading as a word — the repeated
 * narrow strokes of A, I, A, A merged into a grey band a person had to stop
 * and parse. The compact treatment exists to fix that and nothing else; the
 * name, the face and the colour are unchanged.
 */
export default function Wordmark({ size, variant = 'compact', as: Tag = 'span', style, className = '', ...rest }) {
  const compact = variant === 'compact';
  return (
    <Tag
      className={`${compact ? 'mark mark-compact' : 'mark'} ${className}`.trim()}
      style={{ ...(size ? { fontSize: `${size}px` } : null), lineHeight: 1, ...style }}
      {...rest}
    >
      AIYAASI
    </Tag>
  );
}
