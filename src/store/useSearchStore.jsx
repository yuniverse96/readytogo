import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSearchStore = create(
  persist(
    (set) => ({
      address: '',
      setAddress: (newAddress) => set({ address: newAddress }),

      // 현재 위치 상태
      currentPosition: { lat: null, lon: null },
      setCurrentPosition: ({ lat, lon }) => set({ currentPosition: { lat, lon } }),
    }),
    {
      name: 'search-storage', // localStorage에 저장될 key 이름
      // storage: createJSONStorage(() => sessionStorage), 
      // sessionStorage에만 저장하고 싶으면 위처럼 옵션 줄 수도 있음
    }
  )
);

export default useSearchStore;
