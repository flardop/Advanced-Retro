import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type CartItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  optionType?: 'cartucho' | 'caja' | 'manual' | 'insert' | 'protector';
  bundleParentId?: string;
};

type CartState = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  update: (id: string, quantity: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      update: (id, quantity) =>
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }),
      clear: () => set({ items: [] }),
    }),
    { name: 'advanced-retro-cart', storage: createJSONStorage(() => localStorage) }
  )
);
