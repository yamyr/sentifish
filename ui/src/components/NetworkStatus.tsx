import { useHealth } from "@/hooks/useApi";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";

export default function NetworkStatus() {
  const { isError, isLoading } = useHealth();
  const showBanner = isError && !isLoading;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-warning/10 px-4 py-2 text-sm text-warning">
            <WifiOff className="h-4 w-4" />
            <span>Unable to reach Sentifish API. Retrying...</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
