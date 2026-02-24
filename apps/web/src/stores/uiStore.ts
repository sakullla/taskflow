import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface UIState {
  // Mobile sidebar
  isMobileSidebarOpen: boolean;
  // Mobile task detail
  isMobileTaskDetailOpen: boolean;
  // Screen size tracking
  isMobile: boolean;
  // Quick Add
  isQuickAddOpen: boolean;

  // Actions
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
  openMobileTaskDetail: () => void;
  closeMobileTaskDetail: () => void;
  setIsMobile: (isMobile: boolean) => void;
  setQuickAddOpen: (isOpen: boolean) => void;
  toggleQuickAdd: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      isMobileSidebarOpen: false,
      isMobileTaskDetailOpen: false,
      isMobile: false,
      isQuickAddOpen: false,

      openMobileSidebar: () => set({ isMobileSidebarOpen: true }),
      closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
      toggleMobileSidebar: () =>
        set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
      openMobileTaskDetail: () => set({ isMobileTaskDetailOpen: true }),
      closeMobileTaskDetail: () => set({ isMobileTaskDetailOpen: false }),
      setIsMobile: (isMobile) => set({ isMobile }),
      setQuickAddOpen: (isOpen) => set({ isQuickAddOpen: isOpen }),
      toggleQuickAdd: () => set((state) => ({ isQuickAddOpen: !state.isQuickAddOpen })),
    }),
    { name: "ui-store" }
  )
);
