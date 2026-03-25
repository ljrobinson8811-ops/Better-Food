import React, { useState } from "react";
import AdminGuard from "../components/admin/AdminGuard.jsx";
import { base44 } from "../api/base44Client.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft, CheckCircle, XCircle, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminModeration() {
  const [filter, setFilter] = useState("pending");
  const queryClient = useQueryClient();

  const { data: queue = [] } = useQuery({
    queryKey: ["modQueue"],
    queryFn: () => base44.entities.ContentModerationQueue.list("-created_date", 100),
    initialData: [],
  });

  const filtered = filter === "all" ? queue : queue.filter((q) => q.status === filter);

  const handleApprove = async (item) => {
    await base44.entities.ContentModerationQueue.update(item.id, { status: "approved", reviewed_by: "admin" });
    const existing = await base44.entities.CommunityPhoto.filter({ photo_url: item.photo_url });
    if (existing.length === 0) {
      await base44.entities.CommunityPhoto.create({
        photo_url: item.photo_url,
        menu_item_id: item.menu_item_id,
        recipe_id: item.recipe_id,
        status: "approved",
        likes_count: 0,
        liked_by: [],
      });
    }
    queryClient.invalidateQueries({ queryKey: ["modQueue"] });
  };

  const handleReject = async (id) => {
    await base44.entities.ContentModerationQueue.update(id, { status: "rejected", reviewed_by: "admin" });
    queryClient.invalidateQueries({ queryKey: ["modQueue"] });
  };

  const counts = {
    pending: queue.filter((q) => q.status === "pending").length,
    flagged: queue.filter((q) => q.status === "flagged").length,
    approved: queue.filter((q) => q.status === "approved").length,
    rejected: queue.filter((q) => q.status === "rejected").length,
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-foreground rounded-b-3xl px-5 pt-14 pb-6">
          <Link to={createPageUrl("AdminDashboard")} className="flex items-center gap-2 text-foreground/40 mb-4">
            <ArrowLeft className="w-4 h-4" /> Admin
          </Link>
          <h1 className="text-2xl font-black text-background">Photo Moderation</h1>
          <p className="text-foreground/35 text-sm mt-1">{counts.pending} pending · {counts.flagged} flagged</p>
        </div>

        <div className="px-5 mt-5">
          <div className="grid grid-cols-4 gap-2 mb-4">
            {Object.entries(counts).map(([k, v]) => (
              <div key={k} className="bg-card border border-border rounded-xl p-2 text-center">
                <p className="text-base font-black text-foreground">{v}</p>
                <p className="text-[9px] text-muted-foreground capitalize">{k}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
            {["pending", "flagged", "approved", "rejected", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap flex-shrink-0 ${filter === f ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}
              >
                {f} {counts[f] !== undefined ? `(${counts[f]})` : ""}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <ShieldAlert className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nothing here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="h-40 bg-secondary flex items-center justify-center">
                    <img src={item.photo_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-bold text-foreground">{item.submitted_by}</p>
                        {item.ai_verdict && <p className="text-[10px] text-muted-foreground">{item.ai_verdict}</p>}
                        {item.ai_score !== undefined && <p className="text-[10px] text-chart-2">AI score: {(item.ai_score * 100).toFixed(0)}%</p>}
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        item.status === "approved" ? "bg-chart-3/15 text-chart-3" :
                        item.status === "rejected" ? "bg-primary/15 text-primary" :
                        item.status === "flagged" ? "bg-chart-4/15 text-chart-4" :
                        "bg-chart-2/15 text-chart-2"
                      }`}>{item.status}</span>
                    </div>
                    {(item.status === "pending" || item.status === "flagged") && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(item)} className="flex-1 flex items-center justify-center gap-1.5 bg-chart-3/15 text-chart-3 rounded-xl py-2 text-xs font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => handleReject(item.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-primary/15 text-primary rounded-xl py-2 text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}