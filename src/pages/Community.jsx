import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { base44 } from "../api/base44Client.js";
import { createPageUrl } from "../utils";
import PullToRefresh from "../components/shared/PullToRefresh.jsx";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function PhotoCard({ photo, userEmail, onLike }) {
  const likedBy = asArray(photo.liked_by);
  const isLiked = Boolean(userEmail && likedBy.includes(userEmail));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={photo.photo_url}
          alt={photo.caption || "Community meal"}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="p-3">
        {photo.caption ? (
          <p className="mb-2 line-clamp-2 text-xs font-medium text-foreground">
            {photo.caption}
          </p>
        ) : null}

        <div className="flex items-center justify-between">
          <p className="max-w-[80px] truncate text-[10px] text-muted-foreground">
            {photo.created_by?.split("@")[0] || "chef"}
          </p>

          <button
            onClick={() => onLike(photo)}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 transition-all active:scale-95 ${
              isLiked
                ? "bg-primary/15 text-primary"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            <Heart className={`h-3 w-3 ${isLiked ? "fill-primary" : ""}`} />
            <span className="text-[10px] font-bold">
              {Number(photo.likes_count || 0)}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Community() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("trending");

  const { data: user = null } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
    initialData: null,
  });

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["communityPhotos"],
    queryFn: async () => {
      const result = await base44.entities.CommunityPhoto.filter({
        status: "approved",
      });
      return asArray(result);
    },
    initialData: [],
  });

  const sortedPhotos = useMemo(() => {
    const cloned = [...photos];

    if (tab === "trending") {
      return cloned.sort(
        (a, b) => Number(b.likes_count || 0) - Number(a.likes_count || 0)
      );
    }

    return cloned.sort(
      (a, b) => new Date(b.created_date) - new Date(a.created_date)
    );
  }, [photos, tab]);

  const likeMutation = useMutation({
    mutationFn: async (photo) => {
      if (!user?.email) return;

      const likedBy = asArray(photo.liked_by);
      const isLiked = likedBy.includes(user.email);

      const nextLikedBy = isLiked
        ? likedBy.filter((email) => email !== user.email)
        : [...likedBy, user.email];

      await base44.entities.CommunityPhoto.update(photo.id, {
        liked_by: nextLikedBy,
        likes_count: nextLikedBy.length,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["communityPhotos"] });
    },
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["communityPhotos"] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background">
        <div className="rounded-b-3xl bg-foreground px-5 pb-6 pt-14">
          <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-background/40">
            Social
          </p>
          <h1 className="text-2xl font-black text-background">Community</h1>
          <p className="mt-1 text-sm text-background/60">
            Better meals made by real people
          </p>

          <div className="mt-4 flex gap-1 rounded-xl bg-background/10 p-1">
            {[
              { value: "trending", label: "🔥 Trending" },
              { value: "recent", label: "🕐 Recent" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setTab(item.value)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                  tab === item.value ? "bg-primary text-white" : "text-background/40"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 px-5">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="shimmer aspect-square rounded-2xl" />
              ))}
            </div>
          ) : sortedPhotos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 py-16 text-center"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary text-4xl">
                📸
              </div>

              <h3 className="text-base font-black text-foreground">
                No photos yet
              </h3>

              <p className="mx-auto mt-2 max-w-[240px] text-sm leading-relaxed text-muted-foreground">
                Generate a recipe and share your homemade version with the community.
              </p>

              <Link
                to={createPageUrl("Explore")}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white transition-transform active:scale-95"
              >
                <Camera className="h-4 w-4" />
                Start Cooking
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence>
                {sortedPhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    userEmail={user?.email}
                    onLike={(selectedPhoto) => likeMutation.mutate(selectedPhoto)}
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