import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompareStore {
  productIds: number[];
  addProduct: (id: number) => void;
  removeProduct: (id: number) => void;
  clearAll: () => void;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set) => ({
      productIds: [],
      addProduct: (id: number) => set((state: CompareStore) => {
        if (state.productIds.includes(id)) {
          return state;
        }
        if (state.productIds.length >= 4) {
          return state; // 최대 4개까지만
        }
        return { productIds: [...state.productIds, id] };
      }),
      removeProduct: (id: number) => set((state: CompareStore) => ({
        productIds: state.productIds.filter((pid: number) => pid !== id)
      })),
      clearAll: () => set({ productIds: [] }),
    }),
    {
      name: 'compare-storage',
    }
  )
);
