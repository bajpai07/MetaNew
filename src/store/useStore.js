import { create } from "zustand";

const useStore = create((set, get) => ({
  cart: [],

  addToCart: (product) => {
    set((state) => {
      const existing = state.cart.find(
        (item) => item._id === product._id
      );

      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item._id === product._id
              ? { ...item, qty: item.qty + 1 }
              : item
          ),
        };
      }

      return {
        cart: [
          ...state.cart,
          {
            _id: product._id,
            name: product.name,
            image: product.image,
            price: Number(product.price),
            qty: 1,
          },
        ],
      };
    });
  },

  removeFromCart: (id) =>
    set((state) => ({
      cart: state.cart.filter((item) => item._id !== id),
    })),

  updateQty: (id, qty) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item._id === id
          ? { ...item, qty: Math.max(1, qty) }
          : item
      ),
    })),

  // ✅ ADD THIS
  clearCart: () => set({ cart: [] }),

  cartCount: () =>
    get().cart.reduce((sum, item) => sum + item.qty, 0),

  cartTotal: () =>
    get().cart.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    ),
}));

export default useStore;
