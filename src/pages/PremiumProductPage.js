import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getProducts } from '../api/productService';
import TryOnExperience from '../components/vton/TryOnExperience';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function PremiumProductPage() {
  const [product, setProduct] = useState(null);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      try {
        const res = await getProducts();
        const productData = Array.isArray(res) ? res[0] : (res.data ? res.data[0] : null);
        
        if (productData) {
          setProduct({
            ...productData,
            image: productData.image || productData.imageUrl || 'https://images.unsplash.com/photo-1595777457583-95e059d58188?q=80&w=2000',
            price: productData.price || 5999,
          });
        }
      } catch (error) {
        console.error("Failed to load product", error);
      }
    };
    fetchProduct();
  }, []);

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
      
      {/* Top minimal navigation spacer could go here if needed, Navbar covers top */}
      <div className="w-full flex flex-col md:flex-row max-w-[1600px] mx-auto">
        
        {/* LEFT COMPONENT: 70% Immersive Hero Image */}
        <div 
          onClick={() => setIsTryOnOpen(true)}
          className="w-full md:w-[65%] lg:w-[70%] h-[60vh] md:h-[calc(100vh-80px)] overflow-hidden relative group bg-gray-50 cursor-pointer"
        >
          <motion.img 
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-[2s] ease-out will-change-transform"
          />
          {/* Subtle dark overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-500 ease-out flex items-center justify-center">
             {/* The Interactive Call to Action */}
             <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileHover={{ scale: 1.05 }}
               className="opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-8 group-hover:translate-y-0"
             >
               <div className="px-8 py-4 bg-white/20 backdrop-blur-xl border border-white/40 text-white rounded-full font-semibold tracking-wide text-lg shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center gap-3">
                 <span className="text-xl">✨</span> Try this look on you
               </div>
             </motion.div>
          </div>
        </div>

        {/* RIGHT COMPONENT: 30% Sticky Product Info */}
        <div className="w-full md:w-[35%] lg:w-[30%] px-8 py-12 md:py-20 md:sticky md:top-20 md:h-[calc(100vh-80px)] flex flex-col justify-center overflow-y-auto no-scrollbar">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col max-w-sm mx-auto w-full"
          >
            <h3 className="text-[11px] uppercase tracking-[0.25em] font-semibold text-gray-400 mb-4">
              {product.brand || 'Studio Collection'}
            </h3>
            
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black leading-[1.1] mb-6">
              {product.name}
            </h1>

            <p className="text-2xl font-medium tracking-tight text-gray-900 mb-10">
              ₹{product.price.toLocaleString()}
            </p>

            <div className="w-full h-px bg-gray-100 mb-10"></div>

            <p className="text-[15px] leading-relaxed text-gray-500 font-light mb-12">
              {product.description || "Masterfully tailored for an exceptional fit. This signature piece offers a refined aesthetic with uncompromised comfort, utilizing premium materials designed to move with you."}
            </p>

            <div className="flex flex-col gap-4 w-full">
              {/* Primary Add to Bag */}
              <button 
                onClick={async () => {
                  try {
                    await toast.promise(addToCart(product._id), {
                      loading: 'Adding...', success: 'Added to bag', error: 'Failed'
                    }, {
                      style: { background: '#000', color: '#fff' }
                    });
                  } catch (e) {}
                }}
                className="w-full py-4 bg-black text-white rounded-full text-[15px] font-semibold tracking-wide hover:bg-gray-900 transition-colors shadow-lg shadow-black/10 active:scale-[0.98]"
              >
                Add to Bag
              </button>

              {/* Gradient AI Try-On CTA */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-400 to-indigo-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
                <button 
                  onClick={() => setIsTryOnOpen(true)}
                  className="relative w-full py-4 bg-white text-gray-900 rounded-full text-[15px] font-bold tracking-wide flex items-center justify-center gap-2 transition-transform active:scale-[0.98] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#ai-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                    <defs>
                      <linearGradient id="ai-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  <span className="relative z-10 bg-gradient-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent">
                    Try with AI
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
          
        </div>
      </div>

      {/* Fullscreen AI Try-On Experience */}
      <TryOnExperience 
        isOpen={isTryOnOpen} 
        onClose={() => setIsTryOnOpen(false)}
        product={product}
      />
    </div>
  );
}
