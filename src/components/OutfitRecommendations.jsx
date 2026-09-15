import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config/api';

/**
 * Shown under a finished look. Three pieces, plainly. The old version put a
 * tracked "✦ YOU MIGHT ALSO LIKE" eyebrow above a serif heading, a discount
 * badge on each thumbnail and a floating "✦ TRY THIS" pill over every image —
 * four pieces of chrome on a 100px-wide product. The whole thumbnail is the
 * button now.
 */
const OutfitRecommendations = ({ productId, onTryThis }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/api/products/recommendations/${productId}`
      );

      if (res.data.success) {
        setRecommendations(res.data.recommendations);
      }
    } catch (err) {
      // Silent fail — a missing recommendation is not worth an error state
      console.error('Failed to fetch recommendations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!loading && recommendations.length === 0) return null;

  return (
    <section className="gutter" style={{ paddingTop: '40px' }}>
      <h3 className="display display-m" style={{ marginBottom: '20px' }}>
        Try these next
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {loading
          ? [1, 2, 3].map((i) => (
              <div key={i}>
                <div className="loading-block" style={{ aspectRatio: '4/5', width: '100%' }} />
              </div>
            ))
          : recommendations.map((item) => (
              <button
                key={item._id}
                onClick={() => onTryThis(item)}
                style={{ textAlign: 'left', display: 'block' }}
              >
                <div className="goods" style={{ marginBottom: '10px' }}>
                  <img src={item.image} alt={item.name} loading="lazy" />
                </div>

                <p
                  style={{
                    fontSize: 'var(--t-s)',
                    marginBottom: '3px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.name}
                </p>
                <p className="meta">₹{Number(item.price || 0).toLocaleString('en-IN')}</p>
              </button>
            ))}
      </div>
    </section>
  );
};

export default OutfitRecommendations;
