# Mobile-First UI/UX Redesign Plan

This document outlines the step-by-step plan to optimize the frontend for a modern, mobile-first experience, focusing on intuitive touch interactions and native-app-like fluidity.

## Phase 1: Global Layout & Navigation (Mobile-First)
- [x] **Bottom Navigation Bar:** 
  - Create a new `BottomNav.tsx` component.
  - Implement fixed bottom navigation for mobile (My Day, Important, Tasks, Lists).
  - Update `MainLayout.tsx` to hide the top hamburger menu and display the bottom nav on mobile screens (`< lg`).
- [x] **Floating Action Button (FAB):**
  - Implement a global FAB (`+` icon) in the bottom right corner (above the nav bar) for quick task creation.
  - Add a smooth `framer-motion` expansion animation when clicking the FAB to reveal the task input field.
- [x] **Header Simplification:**
  - Clean up the mobile header (`Header.tsx`) to only show the current view title and search/profile icons.

## Phase 2: Task Item Touch Interactions
- [x] **Swipe Actions:**
  - Refactor `TaskItem.tsx` using `framer-motion` drag capabilities.
  - Implement Swipe Right to Mark Completed/Uncompleted.
  - Implement Swipe Left to Reveal Delete/Important actions.
- [x] **Touch Target Optimization:**
  - Increase padding and ensure all interactive elements (checkboxes, stars) have a minimum touch target area of 44x44px.
- [x] **Haptic Feedback & Animation:**
  - Add physical-feeling spring animations on task completion.
  - (Optional) Trigger `navigator.vibrate` for tactile feedback on mobile devices when swiping.

## Phase 3: Detail Views as Bottom Sheets
- [ ] **Task Detail Bottom Sheet:**
  - Refactor `MobileTaskDetail.tsx` to behave like a native Bottom Sheet instead of a side drawer or full page.
  - Implement drag-down to dismiss functionality.
  - Ensure keyboard avoidance (input fields don't get hidden under the mobile virtual keyboard).

## Phase 4: Visual Polish & Styling
- [ ] **Modern UI Aesthetics:**
  - Update Tailwind utility classes to use softer, more modern shadows (`shadow-sm`, `shadow-md` with lower opacity).
  - Refine card border radiuses (e.g., `rounded-xl` or `rounded-2xl` for a softer look).
- [ ] **Dark Mode Refinement:**
  - Ensure pure black backgrounds (`bg-black` or very dark gray `bg-zinc-950`) for OLED mobile screens if applicable.
- [ ] **PWA Enhancements:**
  - Configure `safe-area-inset-bottom` in CSS to prevent the bottom navigation from overlapping with iOS home indicators.
