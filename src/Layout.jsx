import React, { useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Search, Heart, Users, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const navItems = [
  { name: "Home",      icon: Home,   page: "Home" },
  { name: "Explore",   icon: Search, page: "Explore" },
  { name: "Saved",     icon: Heart,  page: "Favorites" },
  { name: "Community", icon: Users,  page: "Community" },
  { name: "Profile",   icon: User,   page: "Profile" },
];

// Maps every page to its owning tab so deep navigation preserves tab state
const pageToTab = {
  Home: "Home",
  Explore: "Explore",
  RestaurantDetail: "Explore",
  RecipeDetail: "Explore",
  CookingMode: "Explore",
  Favorites: "Favorites",
  Community: "Community",
  Profile: "Profile",
  AdminDashboard: "Profile",
  AdminAnalytics: "Profile",
  AdminErrors: "Profile",
  AdminMenuIngestion: "Profile",
  AdminModeration: "Profile",
  AdminPremium: "Profile",
  AdminRecipeLogs: "Profile",
};

export default function Layout({ children, currentPageName }) {
  const hideNav = ["CookingMode"].includes(currentPageName);
  const navigate = useNavigate();
  const location = useLocation();
  const tabHistory = useRef({});

  // System dark mode detection — runs once on mount and listens for changes
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const apply = (e) => document.documentElement.classList.toggle("dark", e.matches);
    apply(mq);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const activeTab = pageToTab[currentPageName] || currentPageName;

  // Keep per-tab URL history up-to-date as user navigates within a tab
  useEffect(() => {
    if (activeTab) {
      tabHistory.current[activeTab] = location.pathname + location.search;
    }
  }, [location.pathname, location.search, activeTab]);

  const handleTabPress = (item) => {
    if (item.page === activeTab) return; // already on this tab — no-op
    const savedUrl = tabHistory.current[item.page];
    navigate(savedUrl ?? createPageUrl(item.page));
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <main className={`flex-1 overflow-x-hidden ${hideNav ? "" : "pb-24"}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentPageName}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ minHeight: "100vh" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {!hideNav && (
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-card/95 backdrop-blur-xl border-t border-border z-50"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center justify-around py-3 px-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.page;
              return (
                <button
                  key={item.name}
                  onClick={() => handleTabPress(item)}
                  className={`select-none flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all duration-200 relative ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {isActive && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                  <item.icon
                    className={`w-5 h-5 transition-all duration-200 ${isActive ? "scale-110" : ""}`}
                    fill={isActive && item.name === "Saved" ? "currentColor" : "none"}
                  />
                  <span className={`text-[10px] font-semibold tracking-wide transition-all ${isActive ? "opacity-100" : "opacity-60"}`}>
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}