import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import LookViewerModal from '../components/LookViewerModal';
import { API_BASE } from '../config/api';

/**
 * YOUR LOOKS — the hardest test of the mat.
 *
 * A grid of a dozen results from a dozen different rooms and cameras is where
 * an inconsistent photo library normally falls apart. Mounting every one in
 * the same bone mat with the same grade and vignette is what holds it
 * together: the frames are identical even when the photographs are not, and
 * the eye reads the rhythm of the mats rather than the differences between the
 * pictures.
 */
const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedLook, setSelectedLook] = useState(null);

  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchHistory(page);
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, token]);

  const fetchHistory = async (pageNumber) => {
    if (pageNumber === 1) setIsLoading(true);

    try {
      const { data } = await axios.get(
        `${API_BASE}/api/history?page=${pageNumber}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (data.success) {
        if (pageNumber === 1) {
          setHistory(data.history);
        } else {
          setHistory((prev) => [...prev, ...data.history]);
        }
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error('Error fetching history', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${API_BASE}/api/history/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete every saved look? This cannot be undone.')) return;
    setIsClearing(true);
    try {
      await axios.delete(
        `${API_BASE}/api/history`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setHistory([]);
      setHasMore(false);
    } catch (err) {
      console.error('Failed to clear', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `aiyaashi-look-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const shell = (children) => (
    <div className="page">
      <div
        className="gutter"
        style={{
          paddingTop: '34px',
          paddingBottom: '24px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '20px'
        }}
      >
        <h1 className="display display-l">Your looks</h1>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={isClearing}
            className="label"
            style={{ color: 'var(--ash)', minHeight: '44px' }}
          >
            {isClearing ? 'Clearing' : 'Clear all'}
          </button>
        )}
      </div>
      <div className="rule" />
      {children}
    </div>
  );

  if (isLoading && page === 1) {
    return shell(
      <div className="gutter looks-grid" style={{ paddingTop: '28px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mat">
            <div className="loading-block" style={{ aspectRatio: '3/4', width: '100%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!token) {
    return shell(
      <div className="gutter" style={{ paddingTop: '72px' }}>
        <p className="display display-m" style={{ marginBottom: '12px' }}>
          Sign in to see your looks
        </p>
        <p className="meta measure" style={{ marginBottom: '36px' }}>
          Everything you try on is kept to your account.
        </p>
        <Link to="/login" className="textlink">
          Sign in
        </Link>
      </div>
    );
  }

  if (history.length === 0) {
    return shell(
      <div className="gutter" style={{ paddingTop: '72px' }}>
        <p className="display display-m" style={{ marginBottom: '12px' }}>
          You haven't saved a look yet
        </p>
        <p className="meta measure" style={{ marginBottom: '36px' }}>
          Open any piece and see it on yourself — it will be waiting here
          afterwards.
        </p>
        <Link to="/" className="textlink">
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <>
      {shell(
        <>
          <div className="gutter looks-grid" style={{ paddingTop: '28px' }}>
            {history.map((item) => (
              <figure
                key={item._id}
                className="mat"
                onClick={() => setSelectedLook(item)}
                style={{ cursor: 'pointer' }}
              >
                <div className="aperture">
                  <img
                    src={item.resultUrl || item.productImage}
                    alt={item.productName || 'A saved look'}
                    loading="lazy"
                    className="graded"
                    style={item.status === 'failed' ? { opacity: 0.25 } : undefined}
                  />
                </div>

                <figcaption className="mat-caption">
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.status === 'failed'
                      ? 'Did not develop'
                      : item.productName || 'Your look'}
                  </span>
                  <span>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </figcaption>

                <div style={{ display: 'flex', gap: '22px', marginTop: '12px' }}>
                  {item.status === 'completed' && item.resultUrl && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(item.resultUrl); }}
                      className="label"
                      style={{ color: 'var(--paper-ink)', minHeight: '44px' }}
                    >
                      Save
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                    className="label"
                    style={{ color: 'var(--paper-ash)', minHeight: '44px' }}
                  >
                    Delete
                  </button>
                </div>
              </figure>
            ))}
          </div>

          {hasMore && (
            <div className="gutter" style={{ padding: '40px var(--gutter) 80px' }}>
              <button onClick={() => setPage((p) => p + 1)} disabled={isLoading} className="textlink">
                {isLoading ? 'Loading' : 'Show more'}
              </button>
            </div>
          )}
        </>
      )}

      {selectedLook && (
        <LookViewerModal
          look={selectedLook}
          onClose={() => setSelectedLook(null)}
          onDownload={handleDownload}
        />
      )}
    </>
  );
};

export default HistoryPage;
