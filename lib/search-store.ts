"use client";

import { create } from "zustand";

type SearchState = {
  query: string;
  setQuery: (q: string) => void;
};

export const useSearch = create<SearchState>((set) => ({
  query: "",
  setQuery: (q) => set({ query: q }),
}));
