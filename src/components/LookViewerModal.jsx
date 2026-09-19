import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Back } from './Marks';

/**
 * One look, full height, still in its mat. The grid and the modal show the
 * same photograph mounted the same way, so opening one is a change of scale
 * rather than a change of presentation.
 */
const LookViewerModal = ({ look, onClose, onDownload }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const imageUrl = look.resultUrl || look.productImage;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My look from AIYAASI',
          text: 'Seen on me before I decided. AIYAASI.',
          url: imageUrl
        });
      } catch (err) {
      }
    } else {
      navigator.clipboard?.writeText(imageUrl);
    }
  };

  const handleTryAgain = () => {
    onClose();
    if (look.productId) {
      navigate(`/products/${look.productId}`, {
        state: { openAITab: true, garmentImage: look.productImage }
      });
    } else {
      navigate('/try-on', { state: { garment: look.productImage } });
    }
  };

  const saved = new Date(look.createdAt).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}
    >
      <header
        className="gutter"
        style={{
          height: 'var(--nav-h)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--veil)'
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ display: 'flex', alignItems: 'center', width: '44px', height: '44px', marginLeft: '-13px' }}
        >
          <Back />
        </button>
        <span className="label" style={{ color: 'var(--ash)' }}>Your look</span>
        <span style={{ width: '44px' }} />
      </header>

      <div className="gutter" style={{ paddingTop: '24px', paddingBottom: '24px', maxWidth: '620px', width: '100%', marginInline: 'auto' }}>
        <figure className="mat">
          <div className="aperture">
            {loading && <div className="loading-block" style={{ position: 'absolute', inset: 0 }} />}
            <img
              src={imageUrl}
              alt={look.productName || 'A saved look'}
              onLoad={() => setLoading(false)}
              className="graded"
              style={{ opacity: loading ? 0 : 1, transition: 'opacity var(--d-state) var(--ease-drape)' }}
            />
          </div>
          <figcaption className="mat-caption">
            <span>{look.productName || 'Your look'}</span>
            <span>{saved}</span>
          </figcaption>
        </figure>

        {look.fitScore && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 0',
              borderBottom: '1px solid var(--veil)',
              fontSize: 'var(--t-s)',
              marginTop: '24px'
            }}
          >
            <span style={{ color: 'var(--ash)' }}>Fit</span>
            <span>{look.fitScore}%</span>
          </div>
        )}
      </div>

      <div className="dock" style={{ position: 'sticky', bottom: 0, marginTop: 'auto', display: 'flex', gap: '1px' }}>
        <button onClick={handleShare} className="btn btn-quiet" style={{ flex: 1 }}>
          Share
        </button>
        <button onClick={() => onDownload(imageUrl)} className="btn btn-quiet" style={{ flex: 1 }}>
          Save
        </button>
        <button onClick={handleTryAgain} className="btn btn-primary" style={{ flex: 1 }}>
          Try another
        </button>
      </div>
    </div>
  );
};

export default LookViewerModal;
