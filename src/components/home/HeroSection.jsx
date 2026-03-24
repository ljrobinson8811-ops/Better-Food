import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Heart, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection({ userName }) {
  return (
    <div className="relative overflow-hidden bg-foreground rounded-b-[2.5rem] px-5 pt-14 pb-8">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `radial-gradient(circle at 20% 50%, hsl(0 78% 48%) 0%, transparent 60%), radial-gradient(circle at 80% 20%, hsl(217 91% 65%) 0%, transparent 50%)`
      }} />
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/8 blur-3xl -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-chart-2/8 blur-2xl translate-y-8 -translate-x-8" />

      <div className="relative z-10">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-4"
        >
          <div className="flex items-center gap-1.5 bg-primary/20 border border-primary/30 rounded-full px-3 py-1">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-primary text-[11px] font-bold uppercase tracking-wider">Better Food</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <p className="text-background/55 text-sm font-medium mb-1">
            {userName ? `Hey ${userName.split(" ")[0]} 👋` : "Welcome back 👋"}
          </p>
          <h1 className="text-[2rem] font-black text-background leading-[1.1] tracking-tight">
            Eat what you crave.
            <br />
            <span className="text-primary">Build the body</span>
            <br />
            you want.
          </h1>
          <p className="text-background/50 text-sm mt-3 leading-relaxed max-w-[280px]">
            Recreate fast food with better ingredients, more protein, and lower cost.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex gap-3 mt-6"
        >
          <Link
            to={createPageUrl("Explore")}
            className="flex-1 bg-primary text-white rounded-2xl px-4 py-3.5 flex items-center justify-center gap-2 font-bold text-sm active:scale-[0.97] transition-transform glow-red"
          >
            <Search className="w-4 h-4" />
            Find Fast Food
          </Link>
          <Link
            to={createPageUrl("Favorites")}
            className="bg-background/10 border border-background/20 text-background rounded-2xl px-4 py-3.5 flex items-center gap-2 font-bold text-sm active:scale-[0.97] transition-transform"
          >
            <Heart className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}