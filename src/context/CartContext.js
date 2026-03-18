import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const { user } = useAuth();

  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('guestId', guestId);
  }
  
  const userId = user ? (user.id || user._id) : guestId;
  const API_URL = 'http://localhost:4000/api/cart';

  const fetchCart = async () => {
    try {
      const { data } = await axios.get(API_URL, { params: { userId } });
      if (data && Array.isArray(data.items)) {
        setCartItems(data.items);
        const count = data.items.reduce((acc, item) => acc + (item.qty || 1), 0);
        setCartCount(count);
      } else {
        setCartItems([]);
        setCartCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [userId]);

  const addToCart = async (productId) => {
    // Return a promise so components can show toasts based on resolution
    const response = await axios.post(`${API_URL}/add`, { productId, qty: 1, userId });
    
    if (response.status === 200) {
       setCartItems(response.data.items);
       const count = response.data.items.reduce((acc, item) => acc + item.qty, 0);
       setCartCount(count);
       return response.data;
    }
    throw new Error("Failed to add to cart");
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await axios.delete(`${API_URL}/${productId}`, { data: { userId } });
      if (response.status === 200) {
        setCartItems(response.data.items);
        const count = response.data.items.reduce((acc, item) => acc + item.qty, 0);
        setCartCount(count);
      }
    } catch (error) {
      console.error("Failed to remove item", error);
      throw error;
    }
  };

  const updateQty = async (productId, qty) => {
    try {
      const response = await axios.patch(`${API_URL}/update`, { productId, qty, userId });
      if (response.status === 200) {
        setCartItems(response.data.items);
        const count = response.data.items.reduce((acc, item) => acc + item.qty, 0);
        setCartCount(count);
      }
    } catch (error) {
      console.error("Failed to update quantity", error);
      throw error;
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, cartCount, addToCart, fetchCart, removeFromCart, updateQty, userId }}>
      {children}
    </CartContext.Provider>
  );
};
