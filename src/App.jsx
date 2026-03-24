import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { queryClientInstance } from "@/lib/query-client";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { pagesConfig } from "@/pages.config";
import PageNotFound from "@/lib/PageNotFound";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";

const { Pages, Layout, mainPage } = pagesConfig;

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
    </div>
  );
}

function LayoutWrapper({ children, currentPageName }) {
  if (!Layout) {
    return children;
  }

  return (
    <Layout currentPageName={currentPageName}>
      {children}
    </Layout>
  );
}

function getMainPageName() {
  if (mainPage && Pages?.[mainPage]) {
    return mainPage;
  }

  const pageNames = Object.keys(Pages || {});
  return pageNames.length > 0 ? pageNames[0] : null;
}

function AppRoutes() {
  const {
    isBootstrapping,
    authError,
    canAccessApp,
    shouldShowLoginRedirect,
    navigateToLogin,
  } = useAuth();

  const resolvedMainPageName = getMainPageName();
  const MainPageComponent = resolvedMainPageName
    ? Pages[resolvedMainPageName]
    : null;

  if (isBootstrapping) {
    return <FullScreenLoader />;
  }

  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  if (shouldShowLoginRedirect) {
    navigateToLogin();
    return <FullScreenLoader />;
  }

  if (!canAccessApp) {
    return <PageNotFound />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          MainPageComponent ? (
            <LayoutWrapper currentPageName={resolvedMainPageName}>
              <MainPageComponent />
            </LayoutWrapper>
          ) : (
            <Navigate to="*" replace />
          )
        }
      />

      {Object.entries(Pages || {}).map(([pageName, PageComponent]) => (
        <Route
          key={pageName}
          path={`/${pageName}`}
          element={
            <LayoutWrapper currentPageName={pageName}>
              <PageComponent />
            </LayoutWrapper>
          }
        />
      ))}

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}