import { create } from 'zustand';

const useSearchStore = create((set) => ({
  address: '',
  setAddress: (newAddress) => set({ address: newAddress }),


  // 현재 위치 상태
  currentPosition: { lat: null, lon: null },
  setCurrentPosition: ({ lat, lon }) => set({ currentPosition: { lat, lon } }),
}));

export default useSearchStore;
