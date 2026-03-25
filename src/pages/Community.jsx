import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PullToRefresh from "@/components/shared/PullToRefresh";
import { Heart, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

function PhotoCard({ photo, onLike, userEmail }) {
  const isLiked = photo.liked_by?.includes(userEmail);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      <div className="aspect-square bg-secondary relative overflow-hidden">
        <img
          src={photo.photo_url}
          alt={photo.caption || "Community meal"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-3">
        {photo.caption && (
          <p className="text-xs font-medium text-foreground mb-2 line-clamp-2 selectable-text">{photo.caption}</p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground truncate max-w-[80px]">
            {photo.created_by?.split("@")[0] || "chef"}
          </p>
          <button
            onClick={() => onLike(photo)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all active:scale-95 ${
              isLiked ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
            }`}
          >
            <Heart className={`w-3 h-3 ${isLiked ? "fill-primary" : ""}`} />
            <span className="text-[10px] font-bold">{photo.likes_count || 0}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Community() {
  const [tab, setTab] = useState("trending");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: photos, isLoading } = useQuery({
    queryKey: ["communityPhotos"],
    queryFn: () => base44.entities.CommunityPhoto.filter({ status: "approved" }),
    initialData: [],
  });

  const sorted = tab === "trending"
    ? [...photos].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    : [...photos].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const likeMutation = useMutation({
    mutationFn: async (photo) => {
      if (!user?.email) return;
      const isLiked = photo.liked_by?.includes(user.email);
      const newLiked = isLiked
        ? (photo.liked_by || []).filter(e => e !== user.email)
        : [...(photo.liked_by || []), user.email];
      await base44.entities.CommunityPhoto.update(photo.id, {
        liked_by: newLiked,
        likes_count: newLiked.length,
      });
    },
    onMutate: async (photo) => {
      await queryClient.cancelQueries({ queryKey: ["communityPhotos"] });
      const prev = queryClient.getQueryData(["communityPhotos"]);
      const isLiked = photo.liked_by?.includes(user?.email);
      const newLiked = isLiked
        ? (photo.liked_by || []).filter(e => e !== user?.email)
        : [...(photo.liked_by || []), user?.email];
      queryClient.setQueryData(["communityPhotos"], (old) =>
        (old || []).map(p =>
          p.id === photo.id ? { ...p, liked_by: newLiked, likes_count: newLiked.length } : p
        )
      );
      return { prev };
    },
    onError: (_err, _photo, context) => {
      if (context?.prev) queryClient.setQueryData(["communityPhotos"], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["communityPhotos"] }),
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["communityPhotos"] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background">
      <div className="bg-foreground rounded-b-3xl px-5 pt-14 pb-6">
        <p className="text-background/40 text-[11px] font-black uppercase tracking-widest mb-1">Social</p>
        <h1 className="text-2xl font-black text-background">Community</h1>
        <p className="text-background/60 text-sm mt-1">Better meals made by real people</p>

        <div className="flex bg-background/10 rounded-xl p-1 gap-1 mt-4">
          {[
            { val: "trending", label: "🔥 Trending" },
            { val: "recent",   label: "🕐 Recent" },
          ].map(t => (
            <button
              key={t.val}
              onClick={() => setTab(t.val)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                tab === t.val ? "bg-primary text-white" : "text-foreground/40"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl shimmer" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 px-6"
          >
            <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-4 text-4xl">
              📸
            </div>
            <h3 className="text-base font-black text-foreground">No photos yet</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[240px] mx-auto">
              Generate a recipe and share your homemade version with the community!
            </p>
            <Link
              to={createPageUrl("Explore")}
              className="mt-5 inline-flex items-center gap-2 bg-primary text-white rounded-2xl px-6 py-3 text-sm font-bold active:scale-95 transition-transform"
            >
              <Camera className="w-4 h-4" />
              Start Cooking
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {sorted.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  userEmail={user?.email}
                  onLike={(p) => likeMutation.mutate(p)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <div className="h-4" />
      </div>
    </PullToRefresh>
  );
}