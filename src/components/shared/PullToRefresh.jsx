import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startY = useRef(0);
  const active = useRef(false);
  const pullValue = useRef(0);

  useEffect(() => {
    function handleTouchStart(event) {
      if (window.scrollY !== 0 || refreshing) {
        return;
      }

      startY.current = event.touches[0].clientY;
      active.current = true;
    }

    function handleTouchMove(event) {
      if (!active.current || refreshing) {
        return;
      }

      const delta = event.touches[0].clientY - startY.current;

      if (delta > 0 && window.scrollY === 0) {
        const nextValue = Math.min(delta * 0.45, THRESHOLD * 1.3);
        pullValue.current = nextValue;
        setPullY(nextValue);
      } else {
        active.current = false;
        pullValue.current = 0;
        setPullY(0);
      }
    }

    async function handleTouchEnd() {
      if (!active.current) {
        return;
      }

      active.current = false;

      const finalValue = pullValue.current;
      pullValue.current = 0;
      setPullY(0);

      if (finalValue >= THRESHOLD && typeof onRefresh === "function") {
        setRefreshing(true);

        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onRefresh, refreshing]);

  const progress = Math.min(pullY / THRESHOLD, 1);
  const visible = pullY > 10 || refreshing;

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="ptr-indicator"
            initial={{ opacity: 0, y: -20 }}
            animate={{
              opacity: 1,
              y: refreshing ? 14 : Math.min(pullY * 0.45 + 6, 40),
            }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 22, stiffness: 200 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              zIndex: 200,
              pointerEvents: "none",
            }}
          >
            <div
              className={`w-8 h-8 rounded-full bg-card shadow-md flex items-center justify-center border ${
                progress >= 1 ? "border-primary" : "border-border"
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 text-primary ${refreshing ? "animate-spin" : ""}`}
                style={
                  refreshing ? {} : { transform: `rotate(${progress * 270}deg)` }
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </>
  );
}