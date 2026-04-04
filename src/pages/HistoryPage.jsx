import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import LookViewerModal from '../components/LookViewerModal';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedLook, setSelectedLook] = useState(null);

  const { user, token } = useAuth();

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
        `${process.env.REACT_APP_API_URL || 'http://localhost:10000'}/api/history?page=${pageNumber}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (data.success) {
        if (pageNumber === 1) {
          setHistory(data.history);
        } else {
          setHistory(prev => [...prev, ...data.history]);
        }
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error("Error fetching history", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL || 'http://localhost:10000'}/api/history/${id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setHistory(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete all try-on history?")) return;
    setIsClearing(true);
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL || 'http://localhost:10000'}/api/history`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setHistory([]);
      setHasMore(false);
    } catch (err) {
      console.error("Failed to clear", err);
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
      link.download = `tryon-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32 pt-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl tracking-widest uppercase">My Looks</h1>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className="text-xs tracking-widest text-[#E8395A] uppercase hover:opacity-80 disabled:opacity-50"
            >
              Clear All
            </button>
          )}
        </div>

        {isLoading && page === 1 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-[3/4] bg-white/5 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : !token ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 text-[#E8395A]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-sm tracking-widest uppercase mb-4">Please sign in to view history</p>
            <Link to="/login" className="px-8 py-3 bg-[#E8395A] hover:bg-[#c42d4a] text-white rounded-full text-xs tracking-widest uppercase transition-colors font-bold">
              Sign In
            </Link>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-70">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-6 mx-auto text-white/40">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-sm font-medium tracking-widest uppercase mb-1">No saved looks yet ✨</p>
            <p className="text-xs text-white/50 tracking-wider">Try your first AI outfit</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              <AnimatePresence>
                {history.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    key={item._id}
                    onClick={() => setSelectedLook(item)}
                    className="relative group bg-[#111] rounded-2xl overflow-hidden border border-white/10 cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="aspect-[3/4] relative">
                      <img
                        src={item.resultUrl || item.productImage}
                        alt="Try-on Result"
                        loading="lazy"
                        className={`w-full h-full object-cover ${item.status === 'failed' ? 'opacity-30 grayscale' : ''}`}
                      />
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/60 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Status Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {item.status === 'failed' ? (
                          <div className="px-2 py-1 bg-rose-500/80 backdrop-blur-md rounded text-[10px] tracking-wider uppercase font-bold">
                            Failed
                          </div>
                        ) : (
                          <>
                            {item.fitScore && (
                              <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] tracking-wider uppercase flex border border-white/10 items-center gap-1">
                                <span className="text-[#4ade80]">★</span> {item.fitScore}% FIT
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Download */}
                      {item.status === 'completed' && item.resultUrl && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(item.resultUrl); }}
                          className="absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/20 transition-colors"
                        >
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="p-4">
                      {item.productName ? (
                        <h3 className="text-xs font-bold tracking-widest uppercase truncate mb-1 text-white/90">
                          {item.productName}
                        </h3>
                      ) : (
                        <h3 className="text-xs font-bold tracking-widest uppercase mb-1 text-white/50">
                          Custom Try-On
                        </h3>
                      )}
                      
                      <div className="flex items-center justify-between mt-2 text-[10px] font-body text-white/40 uppercase tracking-widest">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.generationTime > 0 && (
                          <span>{(item.generationTime / 1000).toFixed(1)}s</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={isLoading}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs tracking-widest uppercase transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedLook && (
        <LookViewerModal
          look={selectedLook}
          onClose={() => setSelectedLook(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

export default HistoryPage;
