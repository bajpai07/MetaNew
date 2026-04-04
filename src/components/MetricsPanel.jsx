import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

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
        const { data } = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:10000'}/api/metrics`);
        if (data.success) {
          setMetrics({
            totalRequests: data.totalRequests,
            successRate: data.successRate,
            avgGenerationTime: data.avgGenerationTime
          });
          setError(false);
        }
      } catch (err) {
        console.error("Failed to fetch metrics", err);
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
    return (
      <div className="w-full bg-[#111] border border-white/5 rounded-[16px] p-4 text-center font-display text-white/40 text-xs">
        Metrics unavailable
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0a0a0a] border border-white/10 rounded-[16px] p-5 shadow-lg relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8395A] rounded-full blur-[100px] opacity-10 pointer-events-none" />
      
      <div className="flex items-center gap-2 mb-4">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8395A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20V10M18 20V4M6 20v-4"/>
        </svg>
        <h3 className="font-display tracking-[0.15em] text-[10px] sm:text-xs text-[#fafaf8] uppercase font-bold">
          AI Performance
        </h3>
      </div>
      
      <div className="flex justify-between items-end gap-2">
        <div className="flex flex-col flex-1">
          <span className="text-[10px] text-white/50 tracking-widest uppercase mb-1 whitespace-nowrap">Total Try-ons</span>
          <AnimatePresence mode="popLayout">
            <motion.span 
              key={metrics.totalRequests}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-bold text-white tracking-widest"
            >
              {loading ? '-' : metrics.totalRequests}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="w-px h-8 bg-white/10 self-center"></div>

        <div className="flex flex-col flex-1 pl-4">
          <span className="text-[10px] text-white/50 tracking-widest uppercase mb-1 whitespace-nowrap">Success Rate</span>
          <AnimatePresence mode="popLayout">
            <motion.span 
              key={metrics.successRate}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-bold text-[#E8395A] tracking-wider"
            >
              {loading ? '-' : `${metrics.successRate}%`}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="w-px h-8 bg-white/10 self-center"></div>

        <div className="flex flex-col flex-1 pl-4">
          <span className="text-[10px] text-white/50 tracking-widest uppercase mb-1 whitespace-nowrap">Avg Time</span>
          <AnimatePresence mode="popLayout">
            <motion.span 
              key={metrics.avgGenerationTime}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-bold text-white tracking-wider"
            >
              {loading ? '-' : `${(metrics.avgGenerationTime / 1000).toFixed(1)}s`}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;
