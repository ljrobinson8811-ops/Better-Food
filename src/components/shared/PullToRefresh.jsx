import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);
  const pullRef = useRef(0);

  useEffect(() => {
    const onStart = (e) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        active.current = true;
      }
    };
    const onMove = (e) => {
      if (!active.current) return;
      const d = e.touches[0].clientY - startY.current;
      if (d > 0 && window.scrollY === 0) {
        const v = Math.min(d * 0.45, THRESHOLD * 1.3);
        pullRef.current = v;
        setPullY(v);
      } else {
        active.current = false;
        pullRef.current = 0;
        setPullY(0);
      }
    };
    const onEnd = async () => {
      if (!active.current) return;
      active.current = false;
      const v = pullRef.current;
      pullRef.current = 0;
      setPullY(0);
      if (v >= THRESHOLD) {
        setRefreshing(true);
        await onRefresh?.();
        setRefreshing(false);
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [onRefresh]);

  const progress = Math.min(pullY / THRESHOLD, 1);
  const visible = pullY > 10 || refreshing;

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="ptr-indicator"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: refreshing ? 14 : Math.min(pullY * 0.45 + 6, 40) }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 22, stiffness: 200 }}
            style={{ position: "fixed", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 200, pointerEvents: "none" }}
          >
            <div className={`w-8 h-8 rounded-full bg-card shadow-md flex items-center justify-center border ${progress >= 1 ? "border-primary" : "border-border"}`}>
              <RefreshCw
                className={`w-4 h-4 text-primary ${refreshing ? "animate-spin" : ""}`}
                style={refreshing ? {} : { transform: `rotate(${progress * 270}deg)` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}