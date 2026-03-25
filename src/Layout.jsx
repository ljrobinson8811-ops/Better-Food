import React, { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Heart, Users, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { createPageUrl } from "@/utils";

const NAV_ITEMS = [
  { name: "Home", icon: Home, page: "Home" },
  { name: "Explore", icon: Search, page: "Explore" },
  { name: "Saved", icon: Heart, page: "Favorites" },
  { name: "Community", icon: Users, page: "Community" },
  { name: "Profile", icon: User, page: "Profile" },
];

const PAGE_TO_TAB = {
  Home: "Home",
  Explore: "Explore",
  RestaurantDetail: "Explore",
  RecipeDetail: "Explore",
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

function shouldHideNavigation(currentPageName) {
  return ["CookingMode"].includes(currentPageName);
}

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const tabHistoryRef = useRef({});

  const activeTab = useMemo(() => {
    return PAGE_TO_TAB[currentPageName] || currentPageName || "Home";
  }, [currentPageName]);

  const hideNav = shouldHideNavigation(currentPageName);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyMode = (eventOrQuery) => {
      const matches = "matches" in eventOrQuery ? eventOrQuery.matches : false;
      document.documentElement.classList.toggle("dark", matches);
    };

    applyMode(mediaQuery);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", applyMode);
      return () => mediaQuery.removeEventListener("change", applyMode);
    }

    if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(applyMode);
      return () => mediaQuery.removeListener(applyMode);
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (!activeTab) return;
    tabHistoryRef.current[activeTab] = `${location.pathname}${location.search}`;
  }, [activeTab, location.pathname, location.search]);

  const handleTabPress = (item) => {
    if (item.page === activeTab) {
      // Tapping active tab navigates to the root of that tab's stack
      navigate(createPageUrl(item.page));
      return;
    }
    const savedUrl = tabHistory.current[item.page];
    navigate(savedUrl ?? createPageUrl(item.page));
  };

  return (
    <div
      className="relative mx-auto flex min-h-screen max-w-lg flex-col bg-background"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <main className={`flex-1 overflow-x-hidden ${hideNav ? "" : "pb-24"}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${currentPageName}:${location.pathname}${location.search}`}
            initial={{ x: 14, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -14, opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{ minHeight: "100vh" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {!hideNav && (
        <nav
          className="fixed bottom-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur-xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center justify-around px-2 py-3">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.page;

              return (
                <button
                  key={item.name}
                  onClick={() => handleTabPress(item)}
                  className={`relative flex select-none flex-col items-center gap-1 rounded-2xl px-2.5 py-1 transition-all duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {isActive && (
                    <span className="absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                  )}

                  <item.icon
                    className={`h-5 w-5 transition-all duration-200 ${
                      isActive ? "scale-110" : ""
                    }`}
                    fill={isActive && item.name === "Saved" ? "currentColor" : "none"}
                  />

                  <span
                    className={`text-[10px] font-semibold tracking-wide transition-all ${
                      isActive ? "opacity-100" : "opacity-60"
                    }`}
                  >
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