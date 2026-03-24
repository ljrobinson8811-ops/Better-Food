import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl p-4 border border-border relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-full ${color} opacity-10 -translate-y-4 translate-x-4`} />
      <div className={`w-8 h-8 rounded-xl ${color} bg-opacity-15 flex items-center justify-center mb-3`}>
        <Icon className={`w-4 h-4 ${color.replace("bg-", "text-")}`} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}