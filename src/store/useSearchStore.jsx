import { create } from 'zustand';

const useSearchStore = create((set) => ({
  address: '',
  setAddress: (newAddress) => set({ address: newAddress }),
}));

export default useSearchStore;
