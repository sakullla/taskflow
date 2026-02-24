import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/uiStore";

export function FloatingActionButton() {
  const { t } = useTranslation("common");
  const { toggleQuickAdd, isQuickAddOpen } = useUIStore();

  if (isQuickAddOpen) return null;

  return (
    <div className="lg:hidden fixed bottom-20 right-4 z-40">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg shadow-primary/20 bg-primary text-primary-foreground"
          onClick={toggleQuickAdd}
          aria-label={t("actions.add") || "Add task"}
        >
          <Plus className="h-6 w-6 stroke-[2.5]" />
        </Button>
      </motion.div>
    </div>
  );
}
