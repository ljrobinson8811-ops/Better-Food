import React from "react";
import { motion } from "framer-motion";
import { Heart, Users, Star } from "lucide-react";

const mockPosts = [
  { emoji: "🍔", title: "Big Mac Remake", author: "Jake M.", protein: "+18g", saved: "$6.50", likes: 247, tag: "Community Fave" },
  { emoji: "🌮", title: "Taco Bell Crunchwrap", author: "Sofia R.", protein: "+22g", saved: "$5.20", likes: 189, tag: "This Week's Best" },
  { emoji: "🍗", title: "Chick-fil-A Sandwich", author: "Marcus T.", protein: "+30g", saved: "$7.00", likes: 312, tag: "Protein Boost" },
];

export default function SocialProof() {
  return (
    <div className="mt-6 mb-4">
      <div className="px-5 mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-foreground">Community Picks</h2>
          <p className="text-xs text-muted-foreground">What people are making</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          <span>2.4k making this</span>
        </div>
      </div>
      <div className="flex gap-3 px-5 overflow-x-auto no-scrollbar pb-2">
        {mockPosts.map((post, i) => (
          <motion.div
            key={post.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 + i * 0.07 }}
            className="flex-shrink-0 w-[170px] bg-card border border-border rounded-2xl overflow-hidden active:scale-95 transition-transform"
          >
            <div className="h-[90px] bg-gradient-to-br from-secondary to-accent flex items-center justify-center relative">
              <span className="text-5xl">{post.emoji}</span>
              <span className="absolute top-2 left-2 text-[9px] font-black bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                {post.tag}
              </span>
            </div>
            <div className="p-3">
              <p className="text-xs font-bold text-foreground leading-tight">{post.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">by {post.author}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold text-chart-3">{post.protein} protein</span>
                <span className="text-[10px] text-muted-foreground">•</span>
                <span className="text-[10px] font-bold text-chart-4">{post.saved} saved</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Heart className="w-3 h-3 text-primary fill-primary" />
                <span className="text-[10px] text-muted-foreground">{post.likes}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mx-5 mt-4 bg-gradient-to-r from-chart-3/8 to-chart-2/8 border border-chart-3/15 rounded-2xl p-4"
      >
        <div className="flex items-center justify-around">
          {[
            { value: "50k+", label: "Remakes Made" },
            { value: "4.8★", label: "App Rating" },
            { value: "$2M+", label: "User Savings" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-black text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}