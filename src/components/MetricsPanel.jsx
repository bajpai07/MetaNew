import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config/api';

/**
 * Service metrics. This is an operations readout, not merchandising, so it now
 * lives on the administration side rather than inside the fitting room's
 * action bar, and it reads like a ledger line — no blurred accent glow, no
 * bar-chart icon, no animated counters.
 */
const MetricsPanel = () => {
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    successRate: 0,
    avgGenerationTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/metrics`
        );
        if (data.success) {
          setMetrics({
            totalRequests: data.totalRequests,
            successRate: data.successRate,
            avgGenerationTime: data.avgGenerationTime
          });
          setError(false);
        }
      } catch (err) {
        console.error('Failed to fetch metrics', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <p className="meta">Try-on metrics unavailable</p>;
  }

  const rows = [
    ['Looks generated', loading ? '—' : metrics.totalRequests.toLocaleString('en-IN')],
    ['Success rate', loading ? '—' : `${metrics.successRate}%`],
    [
      'Average time',
      loading ? '—' : `${(metrics.avgGenerationTime / 1000).toFixed(1)}s`
    ]
  ];

  return (
    <div>
      <h2 className="label" style={{ color: 'var(--paper-ash)', marginBottom: '14px' }}>
        Try-on service
      </h2>
      {!loading && metrics.totalRequests === 0 ? (
        <p className="meta">No looks generated yet.</p>
      ) : (
        <dl>
          {rows.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '13px 0',
                borderBottom: '1px solid var(--paper-veil)',
                fontSize: 'var(--t-s)'
              }}
            >
              <dt style={{ color: 'var(--paper-ash)' }}>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};

export default MetricsPanel;
