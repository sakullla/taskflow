import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import { MainLayout } from "@/components/layout/MainLayout";
import { MyDayPage } from "@/pages/MyDayPage";
import { ImportantPage } from "@/pages/ImportantPage";
import { PlannedPage } from "@/pages/PlannedPage";
import { AllTasksPage } from "@/pages/AllTasksPage";
import { ListPage } from "@/pages/ListPage";
import { LoginPage } from "@/pages/LoginPage";
import { ToastContainer } from "@/components/ui/toast";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // For demo purposes, always authenticated
  return <>{children}</>;
}

function App() {
  useEffect(() => {
    // Initialize auth from localStorage
    const token = localStorage.getItem("token");
    if (token) {
      // Token loaded
    }
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MyDayPage />} />
              <Route path="important" element={<ImportantPage />} />
              <Route path="planned" element={<PlannedPage />} />
              <Route path="tasks" element={<AllTasksPage />} />
              <Route path="lists/:listId" element={<ListPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;
