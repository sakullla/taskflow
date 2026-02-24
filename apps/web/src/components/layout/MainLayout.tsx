import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { FloatingActionButton } from "./FloatingActionButton";
import { QuickAddOverlay } from "@/components/task/QuickAddOverlay";
import { useUIStore } from "@/stores/uiStore";
import { useTaskStore } from "@/stores/taskStore";
import { api } from "@/lib/api/client";

const MOBILE_BREAKPOINT = 1024;

export function MainLayout() {
  const { setIsMobile } = useUIStore();
  const { setLists } = useTaskStore();
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, [setIsMobile]);

  useEffect(() => {
    const loadLists = async () => {
      try {
        interface ListsResponse {
          success: boolean;
          data: Array<{
            id: string;
            name: string;
            color: string;
            isDefault: boolean;
            isArchived: boolean;
            order: number;
            userId: string;
            taskCount?: number;
            createdAt: string;
            updatedAt: string;
          }>;
        }
        const res = (await api.get<ListsResponse>("/lists")) as unknown as ListsResponse;
        if (res.success) {
          setLists(res.data);
        }
      } catch (error) {
        console.error("Failed to load lists:", error);
      }
    };

    void loadLists();
  }, [setLists]);

  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar (Drawer for Lists) */}
      <MobileSidebar />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header />
        
        <main className="flex-1 overflow-auto p-4 lg:p-6 pb-24 lg:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="h-full max-w-5xl mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Components */}
        <FloatingActionButton />
        <BottomNav />
        <QuickAddOverlay />
      </div>
    </div>
  );
}
