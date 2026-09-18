import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config/api';
import { useAuth } from '../context/AuthContext';

/**
 * Sizing sits inside the product page as a disclosure, not as a bordered
 * widget with a 📏 emoji and a rainbow of per-size colours (XS violet, M lime,
 * XXL red — six accent colours in one 200px panel). Two fields, a rule, an
 * answer in the display face.
 *
 * The calculation, the guest-mode localStorage fallback and the authenticated
 * PUT to /api/users/measurements are unchanged.
 *
 * A token outlives nothing on its own: AuthContext hydrates "logged in"
 * from localStorage alone and nothing here ever checked expiry, so a token
 * past its 7-day life (or otherwise rejected) sat in storage and was resent
 * on every product page forever, 401-ing quietly each time. On a 401 from
 * this endpoint specifically, we end that dead session via the existing
 * logout() rather than leave it to keep failing.
 */

function calculateSizeLocally(height, weight) {
  const bmi = weight / ((height / 100) * (height / 100));
  let size = 'M';
  if (height <= 160) {
    if (bmi < 18.5) size = 'XS';
    else if (bmi < 22) size = 'S';
    else if (bmi < 26) size = 'M';
    else if (bmi < 30) size = 'L';
    else size = 'XL';
  } else if (height <= 170) {
    if (bmi < 18.5) size = 'S';
    else if (bmi < 22) size = 'M';
    else if (bmi < 26) size = 'L';
    else if (bmi < 30) size = 'XL';
    else size = 'XXL';
  } else if (height <= 180) {
    if (bmi < 18.5) size = 'M';
    else if (bmi < 22) size = 'L';
    else if (bmi < 26) size = 'XL';
    else if (bmi < 30) size = 'XXL';
    else size = 'XXL';
  } else {
    if (bmi < 18.5) size = 'M';
    else if (bmi < 22) size = 'L';
    else if (bmi < 26) size = 'XL';
    else size = 'XXL';
  }

  let confidence = 82;
  if (bmi >= 18.5 && bmi <= 27 && height >= 150 && height <= 190) {
    confidence = Math.floor(Math.random() * 6) + 88;
  } else {
    confidence = Math.floor(Math.random() * 8) + 82;
  }

  const messages = {
    XS: 'A slim silhouette',
    S: 'Lean and tailored',
    M: 'The size most people take',
    L: 'Relaxed through the body',
    XL: 'Generous',
    XXL: 'The most room'
  };

  return { size, confidence, message: messages[size] || 'Standard fit' };
}

const SizeRecommendation = ({ onRecommendation }) => {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSavedMeasurements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSavedMeasurements = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        const localData = localStorage.getItem('local_measurements');
        if (localData) {
          const parsed = JSON.parse(localData);
          setHeight(String(parsed.height));
          setWeight(String(parsed.weight));
          setRecommendation(parsed.recommendation);
          setSaved(true);
          onRecommendation?.(parsed.recommendation);
        }
        return;
      }

      const res = await axios.get(
        `${API_BASE}/api/users/measurements`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success && res.data.measurements) {
        setHeight(String(res.data.measurements.height));
        setWeight(String(res.data.measurements.weight));
        setRecommendation(res.data.recommendation);
        setSaved(true);
        onRecommendation?.(res.data.recommendation);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        // The token this browser is holding is dead (expired or otherwise
        // rejected) — end that session instead of resending it on every
        // product page. Otherwise silent, matching the previous behaviour.
        logout();
      }
    }
  };

  const handleCalculate = async () => {
    if (!height || !weight) {
      setError('Enter both height and weight');
      return;
    }

    const h = Number(height);
    const w = Number(weight);

    if (h < 100 || h > 250) {
      setError('Height should be between 100 and 250 cm');
      return;
    }
    if (w < 30 || w > 250) {
      setError('Weight should be between 30 and 250 kg');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        const localRec = calculateSizeLocally(h, w);
        setRecommendation(localRec);
        setSaved(true);
        onRecommendation?.(localRec);
        localStorage.setItem(
          'local_measurements',
          JSON.stringify({ height: h, weight: w, recommendation: localRec })
        );
        setLoading(false);
        return;
      }

      const res = await axios.put(
        `${API_BASE}/api/users/measurements`,
        { height: h, weight: w },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (res.data.success) {
        setRecommendation(res.data.recommendation);
        setSaved(true);
        onRecommendation?.(res.data.recommendation);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        setError('Your session has expired. Sign in again to save this to your account.');
      } else {
        setError('We couldn’t work that out. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ borderTop: '1px solid var(--veil)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="label"
        aria-expanded={open}
        style={{
          width: '100%',
          minHeight: '58px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          color: open ? 'var(--bone)' : 'var(--ash)'
        }}
      >
        <span>
          Find your size
          {recommendation && !open && (
            <span style={{ color: 'var(--bone)', marginLeft: '14px' }}>
              {recommendation.size}
            </span>
          )}
        </span>
        <span aria-hidden="true" style={{ fontSize: '15px', lineHeight: 1 }}>
          {open ? '–' : '+'}
        </span>
      </button>

      {open && (
        <div style={{ paddingBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '22px', maxWidth: '380px' }}>
            <div style={{ flex: 1 }}>
              <label className="meta" htmlFor="size-height" style={{ display: 'block' }}>
                Height in cm
              </label>
              <input
                id="size-height"
                className="field"
                type="number"
                inputMode="numeric"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  setError(null);
                  if (saved) setSaved(false);
                }}
                placeholder="170"
                min="100"
                max="250"
              />
            </div>

            <div style={{ flex: 1 }}>
              <label className="meta" htmlFor="size-weight" style={{ display: 'block' }}>
                Weight in kg
              </label>
              <input
                id="size-weight"
                className="field"
                type="number"
                inputMode="numeric"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  setError(null);
                  if (saved) setSaved(false);
                }}
                placeholder="65"
                min="30"
                max="250"
              />
            </div>
          </div>

          {error && (
            <p className="meta" style={{ color: 'var(--bone)', marginBottom: '16px' }}>
              {error}
            </p>
          )}

          <button
            onClick={handleCalculate}
            disabled={loading || !height || !weight}
            className="textlink"
            style={{ opacity: height && weight ? 1 : 0.4 }}
          >
            {loading ? 'Working it out' : 'Suggest a size'}
          </button>

          {recommendation && (
            <div style={{ marginTop: '30px' }}>
              <div className="rule" style={{ marginBottom: '20px' }} />
              <p className="display display-l" style={{ marginBottom: '8px' }}>
                {recommendation.size}
              </p>
              <p className="meta measure">
                {recommendation.message}
                {recommendation.confidence
                  ? ` · ${recommendation.confidence}% confident`
                  : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SizeRecommendation;
