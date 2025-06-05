import { create } from "zustand";
import { persist } from "zustand/middleware";

type TState = "icon" | "table";
type TStore = {
  data: TState;
  setData: (data: TState) => void;
};

const useInitViewTypeStore = create<TStore>()(
  persist(
    (set) => ({
      data: "icon",
      setData: (data) => set({ data }),
    }),
    {
      name: "pocketdrop-view-type-storage",
    },
  ),
);

export const useViewTypeStore = () => {
  const { data, setData } = useInitViewTypeStore();

  return { data, setData, toggle: () => setData(data === "icon" ? "table" : "icon") };
};
