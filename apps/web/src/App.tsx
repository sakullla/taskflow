import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import { AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoginPage } from "@/pages/LoginPage";
import { ToastContainer } from "@/components/ui/toast";
import { Loading } from "@/components/ui/loading";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
import type { User } from "@/types";
import "./index.css";

// Lazy load pages for better code splitting
const MyDayPage = lazy(() => import("@/pages/MyDayPage"));
const ImportantPage = lazy(() => import("@/pages/ImportantPage"));
const PlannedPage = lazy(() => import("@/pages/PlannedPage"));
const AllTasksPage = lazy(() => import("@/pages/AllTasksPage"));
const ListPage = lazy(() => import("@/pages/ListPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!user) return <Loading fullScreen text="Loading..." />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  if (token && user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Wrap lazy components with Suspense
function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Loading fullScreen text="Loading..." />}>
      {children}
    </Suspense>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={(
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          )}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SuspenseWrapper><MyDayPage /></SuspenseWrapper>} />
          <Route path="important" element={<SuspenseWrapper><ImportantPage /></SuspenseWrapper>} />
          <Route path="planned" element={<SuspenseWrapper><PlannedPage /></SuspenseWrapper>} />
          <Route path="tasks" element={<SuspenseWrapper><AllTasksPage /></SuspenseWrapper>} />
          <Route path="lists/:listId" element={<SuspenseWrapper><ListPage /></SuspenseWrapper>} />
          <Route path="search" element={<SuspenseWrapper><SearchPage /></SuspenseWrapper>} />
          <Route path="settings" element={<SuspenseWrapper><SettingsPage /></SuspenseWrapper>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const { token, user, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (!token || user) {
      return;
    }

    let mounted = true;

    interface MeResponse {
      success: boolean;
      data: User;
    }

    const restoreUser = async () => {
      try {
        const response = (await api.get<MeResponse>("/auth/me")) as unknown as MeResponse;
        if (mounted && response.success) {
          setUser(response.data);
        }
      } catch {
        if (mounted) {
          logout();
        }
      }
    };

    void restoreUser();

    return () => {
      mounted = false;
    };
  }, [logout, setUser, token, user]);

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AnimatedRoutes />
          <ToastContainer />
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;
