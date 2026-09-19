import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import OutfitRecommendations from '../OutfitRecommendations';
import Plate from '../Plate';
import { Back } from '../Marks';
import { API_BASE } from '../../config/api';
import { useFittingPhoto } from '../../context/FittingPhotoContext';

/**
 * THE FITTING ROOM.
 *
 * This is the product. Everything else on the site is quiet so that this
 * screen can be the loud one — and the loud thing here is not a spinner or a
 * progress bar, it is the mat (see components/Plate.jsx and DESIGN.md §5).
 *
 * The customer's photograph is mounted in the same bone mat in every state —
 * empty, chosen, developing, revealed — so the surface never jumps, and so a
 * phone snapshot taken in a badly lit room sits in the same visual language as
 * the catalogue beside it.
 *
 * Removed from the old build, deliberately:
 *   · the full-screen loading overlay, its dual rotating rings, its progress
 *     bar and its five stage dots — replaced by the plate developing in place
 *   · the tab toggle and second copy of the image below the compare slider,
 *     which showed the same two photographs twice
 *   · the AI metrics panel, which was mounted inside the fixed action bar
 *
 * All network behaviour — validation, job creation, polling, download, share,
 * reset, product switching — is unchanged.
 *
 * UPLOAD ONCE, TRY ANYTHING: the photograph itself is remembered in
 * FittingPhotoContext, one level above the router, so it survives the full
 * remount this component gets on every product navigation (App.js keys its
 * <Routes> by pathname). This component still owns the whole Try-On flow —
 * the context only supplies the starting File, exactly as if the visitor had
 * just picked it from disk. Nothing about generation, polling, the result or
 * the compare slider changes.
 */

const LOADING_STAGES = [
  'Reading your photograph',
  'Finding your proportions',
  'Draping the garment',
  'Settling the fabric',
  'Finishing the plate'
];

const TryOnExperience = ({ product, garmentImage, isOpen, onClose }) => {
  const { photoFile, photoPreviewUrl, setFittingPhoto, clearFittingPhoto } = useFittingPhoto() || {};
  const [currentProduct, setCurrentProduct] = useState(product);
  // Seeded straight from the saved fitting-room photo, if one exists, so the
  // very first render already shows it — no flash of an empty upload plate.
  const [uploadedPhoto, setUploadedPhoto] = useState(() => photoFile || null);
  const [previewUrl, setPreviewUrl] = useState(() => photoPreviewUrl || null);
  const [resultUrl, setResultUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [fitScore, setFitScore] = useState(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [generationTime, setGenerationTime] = useState(null);
  const [stageIndex, setStageIndex] = useState(0);
  const stageTimerRef = useRef(null);
  const [isRetryable, setIsRetryable] = useState(false);
  const [warnings, setWarnings] = useState([]);

  const fileInputRef = useRef(null);
  const sliderRef = useRef(null);

  const handleTryThis = (newProduct) => {
    // The photograph carries over to the next garment — only the result
    // belongs to the product being left behind.
    setResultUrl(null);
    setFitScore(null);
    setError(null);
    setWarnings([]);
    setGenerationTime(null);
    setIsRetryable(false);
    setSliderPos(50);
    setCurrentProduct(newProduct);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Loading stages ────────────────────
  const startStages = useCallback(() => {
    setStageIndex(0);
    let index = 0;
    stageTimerRef.current = setInterval(() => {
      index++;
      if (index < LOADING_STAGES.length) setStageIndex(index);
    }, 3000);
  }, []);

  const stopStages = useCallback(() => {
    if (stageTimerRef.current) {
      clearInterval(stageTimerRef.current);
      stageTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    };
  }, []);

  // ── File upload ───────────────────────
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      setError('That file type won’t work. Use a JPG, PNG or WebP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('That photograph is over 10MB. Try a smaller one.');
      return;
    }

    setError(null);
    setResultUrl(null);
    setFitScore(null);
    setWarnings([]);
    setUploadedPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
    // Save it as the fitting-room photo — Product B, C, D reuse this same
    // file without asking again. Replaces whatever was saved before.
    setFittingPhoto?.(file);
  }, [setFittingPhoto]);

  // ── Generation ────────────────────────
  const [, setJobId] = useState(null);
  const [, setJobStatus] = useState(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback((jobId) => {
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 60 × 3s = 3 min

    pollingRef.current = setInterval(async () => {
      attempts++;

      if (attempts > MAX_ATTEMPTS) {
        stopPolling();
        stopStages();
        setIsGenerating(false);
        setIsRetryable(true);
        setError('This is taking longer than it should. Try again.');
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE}/api/vton/status/${jobId}`
        );

        const data = response.data;
        setJobStatus(data.status);

        if (data.status === 'completed') {
          stopPolling();
          stopStages();
          setResultUrl(data.resultUrl);
          setFitScore(data.fitScore);
          setGenerationTime(data.generationTime);
          setWarnings(data.warnings || []);
          setIsGenerating(false);
        } else if (data.status === 'failed') {
          stopPolling();
          stopStages();
          setIsRetryable(true);
          setError(data.error || 'That one didn’t come out. Try again.');
          setIsGenerating(false);
        }
        // pending / processing — keep polling
      } catch (err) {
        // Network blip: don't stop polling, retry on the next interval
        console.error('Polling error:', err.message);
      }
    }, 3000);
  }, [stopPolling, stopStages]);

  const handleGenerate = useCallback(async () => {
    if (!uploadedPhoto) {
      setError('Choose a photograph first.');
      return;
    }

    // A reused photograph is still just the File object from whenever it was
    // chosen — nothing server-side to go stale. The one real failure mode is
    // the browser having discarded it underneath us; guard for it explicitly
    // so that reads as "please choose a new photograph", not a Try-On error.
    if (!(uploadedPhoto instanceof Blob) || uploadedPhoto.size === 0) {
      clearFittingPhoto?.();
      setUploadedPhoto(null);
      setPreviewUrl(null);
      setError('That photograph is no longer available. Please choose a new one.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setIsRetryable(false);
    setResultUrl(null);
    setJobId(null);
    setJobStatus(null);
    startStages();

    try {
      const formData = new FormData();
      formData.append('humanImage', uploadedPhoto);
      formData.append(
        'garmentImageUrl',
        currentProduct?.image || currentProduct?.imageUrl || currentProduct?.images?.[0]
      );
      formData.append('productId', currentProduct?._id || '');
      formData.append('productName', currentProduct?.name || '');
      formData.append('productPrice', currentProduct?.price || '');

      const response = await axios.post(
        `${API_BASE}/api/vton/generate`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 30000
        }
      );

      if (response.data.success && response.data.jobId) {
        const newJobId = response.data.jobId;
        setJobId(newJobId);
        setJobStatus('pending');
        startPolling(newJobId);
      } else {
        throw new Error(response.data.error || 'Failed to start generation');
      }
    } catch (err) {
      console.error('Generate error:', err);
      stopStages();
      setIsGenerating(false);
      setIsRetryable(true);

      let errorMsg = 'That didn’t go through. Try again.';

      if (err.response?.status === 400) {
        errorMsg =
          err.response.data?.error ||
          'We couldn’t read that photograph. Try a clearer one.';
      } else if (!navigator.onLine) {
        errorMsg = 'You’re offline.';
      }

      setError(errorMsg);
    }
  }, [uploadedPhoto, currentProduct, startStages, startPolling, stopStages, clearFittingPhoto]);

  // ── Download ──────────────────────────
  const handleDownload = useCallback(async () => {
    if (!resultUrl) return;
    try {
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        window.open(resultUrl, '_blank');
        return;
      }
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = `aiyaashi-look-${Date.now()}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(resultUrl, '_blank');
    }
  }, [resultUrl]);

  // ── Share ─────────────────────────────
  const handleShare = useCallback(async () => {
    if (!resultUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My look from Aiyaashi',
          text: `${product?.name || 'This piece'}, seen on me before I decide. Aiyaashi.`,
          url: window.location.href
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard?.writeText(window.location.href);
        }
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  }, [resultUrl, product]);

  // ── Reset ─────────────────────────────
  const handleTryAnother = useCallback(() => {
    // This is the fitting room's "change photo": it clears the saved
    // reference too, so the next choice — here or on any future product —
    // replaces it rather than leaving the old one live underneath.
    clearFittingPhoto?.();
    setUploadedPhoto(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setFitScore(null);
    setError(null);
    setWarnings([]);
    setIsRetryable(false);
    setSliderPos(50);
    setGenerationTime(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [clearFittingPhoto]);

  // ── Compare slider ────────────────────
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  const handleSliderMove = useCallback((clientX) => {
    if (!sliderRef.current) return;
    requestAnimationFrame(() => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const pos = Math.min(
        Math.max(((clientX - rect.left) / rect.width) * 100, 0),
        100
      );
      setSliderPos(pos);
    });
  }, []);

  if (!isOpen && typeof isOpen !== 'undefined') return null;

  const stageText = LOADING_STAGES[stageIndex];

  return (
    <div
      style={{
        position: isOpen ? 'fixed' : 'relative',
        inset: isOpen ? 0 : 'auto',
        zIndex: isOpen ? 9999 : 'auto',
        minHeight: '100vh',
        background: 'var(--ink)',
        color: 'var(--bone)',
        overflowY: 'auto',
        paddingBottom: 'calc(150px + env(safe-area-inset-bottom))'
      }}
    >
      {/* ── Header ── */}
      <header
        className="gutter"
        style={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--veil)',
          position: 'sticky',
          top: 0,
          background: 'var(--ink)',
          zIndex: 10
        }}
      >
        <button
          onClick={onClose}
          aria-label="Leave the fitting room"
          style={{ display: 'flex', alignItems: 'center', width: '44px', height: '44px', marginLeft: '-13px' }}
        >
          <Back />
        </button>
        <span className="label" style={{ color: 'var(--ash)' }}>The fitting room</span>
        <span style={{ width: '44px' }} />
      </header>

      {/* ── The plate ── */}
      {!resultUrl ? (
        <>
          <div className="fitting-col" style={{ paddingTop: '24px', paddingBottom: '20px' }}>
            <h2 className="display display-l" style={{ marginBottom: '14px' }}>
              See it on you
            </h2>
            <p className="meta measure">
              One photograph, facing forward, full length if you can. It is
              deleted within twenty-four hours.
            </p>
          </div>

          <div className="fitting-col">
            {previewUrl ? (
              <Plate
                src={previewUrl}
                alt="Your photograph"
                fit="contain"
                processing={isGenerating}
                progress={(stageIndex + 1) / LOADING_STAGES.length}
                caption={isGenerating ? 'Developing' : 'Your photograph'}
                note={isGenerating ? stageText : 'Change'}
                onClick={isGenerating ? undefined : () => fileInputRef.current?.click()}
                style={{ cursor: isGenerating ? 'default' : 'pointer' }}
              />
            ) : (
              <figure className="mat">
                <button
                  className="aperture"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    border: 0,
                    background: 'var(--ink-sunken)'
                  }}
                >
                  <span className="label" style={{ color: 'var(--bone)' }}>
                    Choose a photograph
                  </span>
                </button>
                <figcaption className="mat-caption">
                  <span>Your photograph</span>
                  <span>JPG · PNG · WebP</span>
                </figcaption>
              </figure>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {!previewUrl && (
            <div className="fitting-col" style={{ paddingTop: '32px' }}>
              <div className="rule" style={{ marginBottom: '22px' }} />
              <p className="meta measure">
                It works best with a plain wall behind you, even light, and your
                whole body in frame.
              </p>
            </div>
          )}

          {error && (
            <div className="fitting-col" style={{ paddingTop: '28px' }}>
              <div className="rule" style={{ marginBottom: '20px' }} />
              <p style={{ marginBottom: '18px' }}>{error}</p>
              <button className="textlink" onClick={() => { setError(null); handleGenerate(); }}>
                Try again
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* ── The reveal ──
              The result is wiped down the aperture over 1.1s rather than faded
              in. It is the one moment on this site asking to be watched. */}
          <div className="fitting-col" style={{ paddingTop: '24px' }}>
            <figure className="mat">
              <div className="aperture" ref={sliderRef} style={{ userSelect: 'none' }}>
                <img
                  src={resultUrl}
                  alt={`${currentProduct?.name || 'This piece'}, worn by you`}
                  className="graded developing"
                />

                {/* The original, clipped by the handle */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    clipPath: `inset(0 ${100 - sliderPos}% 0 0)`
                  }}
                >
                  <img
                    src={previewUrl}
                    alt="Your photograph"
                    className="graded"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                  />
                </div>

                {/* Handle */}
                <div
                  role="separator"
                  aria-label="Drag to compare"
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${sliderPos}%`,
                    transform: 'translateX(-50%)',
                    width: '44px',
                    cursor: 'ew-resize',
                    touchAction: 'pan-y',
                    display: 'flex',
                    justifyContent: 'center',
                    zIndex: 2
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    isDraggingRef.current = true;
                    const move = (ev) => {
                      if (isDraggingRef.current) handleSliderMove(ev.clientX);
                    };
                    const up = () => {
                      isDraggingRef.current = false;
                      window.removeEventListener('mousemove', move);
                      window.removeEventListener('mouseup', up);
                    };
                    window.addEventListener('mousemove', move);
                    window.addEventListener('mouseup', up);
                  }}
                  onTouchStart={(e) => {
                    isDraggingRef.current = true;
                    dragStartPosRef.current = {
                      x: e.touches[0].clientX,
                      y: e.touches[0].clientY
                    };
                    const move = (ev) => {
                      if (!isDraggingRef.current) return;
                      const deltaX = Math.abs(ev.touches[0].clientX - dragStartPosRef.current.x);
                      const deltaY = Math.abs(ev.touches[0].clientY - dragStartPosRef.current.y);
                      if (deltaX > deltaY) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        handleSliderMove(ev.touches[0].clientX);
                      }
                    };
                    const end = () => {
                      isDraggingRef.current = false;
                      window.removeEventListener('touchmove', move);
                      window.removeEventListener('touchend', end);
                      window.removeEventListener('touchcancel', end);
                    };
                    window.addEventListener('touchmove', move, { passive: false });
                    window.addEventListener('touchend', end);
                    window.addEventListener('touchcancel', end);
                  }}
                >
                  <div style={{ width: '1px', height: '100%', background: 'var(--bone)' }} />
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '26px',
                      height: '26px',
                      background: 'var(--bone)'
                    }}
                  />
                </div>
              </div>

              <figcaption className="mat-caption">
                <span>{currentProduct?.name || 'Your look'}</span>
                <span>Drag to compare</span>
              </figcaption>
            </figure>
          </div>

          {/* ── The reading ── */}
          <div className="fitting-col" style={{ paddingTop: '30px' }}>
            <div className="rule" />
            {[
              fitScore ? ['Fit', `${fitScore}%`] : null,
              currentProduct?.price
                ? ['Price', `₹${Number(currentProduct.price).toLocaleString('en-IN')}`]
                : null,
              generationTime ? ['Made in', `${(generationTime / 1000).toFixed(1)}s`] : null
            ]
              .filter(Boolean)
              .map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '14px 0',
                    borderBottom: '1px solid var(--veil)',
                    fontSize: 'var(--t-s)'
                  }}
                >
                  <span style={{ color: 'var(--ash)' }}>{label}</span>
                  <span>{value}</span>
                </div>
              ))}
          </div>

          {warnings && warnings.length > 0 && (
            <div className="fitting-col" style={{ paddingTop: '26px' }}>
              <p className="label" style={{ color: 'var(--ash)', marginBottom: '12px' }}>
                Next time
              </p>
              {warnings.map((warning, i) => (
                <p key={i} className="meta measure" style={{ marginBottom: '5px' }}>
                  {warning}
                </p>
              ))}
            </div>
          )}

          <OutfitRecommendations productId={currentProduct?._id} onTryThis={handleTryThis} />
        </>
      )}

      {/* ── Dock ── */}
      <div className="dock" style={{ position: 'fixed', bottom: 0 }}>
        {!resultUrl ? (
          <button
            className={`btn ${uploadedPhoto ? 'btn-primary' : 'btn-quiet'}${isGenerating ? ' btn-working' : ''}`}
            style={{ width: '100%' }}
            onClick={error && isRetryable ? () => { setError(null); handleGenerate(); } : handleGenerate}
            disabled={isGenerating || !uploadedPhoto}
          >
            {isGenerating
              ? 'Developing'
              : error && isRetryable
              ? 'Try again'
              : 'See it on you'}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '1px' }}>
            <button className="btn btn-quiet" style={{ flex: 1 }} onClick={handleShare}>
              Share
            </button>
            <button className="btn btn-quiet" style={{ flex: 1 }} onClick={handleDownload}>
              Save
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleTryAnother}>
              Try another
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TryOnExperience;
