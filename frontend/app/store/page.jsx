"use client";

import { useState, useEffect } from "react";
import { categories } from "../../data/categories";
import { Scene } from "../../components/gb/Scene";
import { Intro } from "../../components/gb/Intro";
import { CategoryPanel } from "../../components/gb/CategoryPanel";
import { FinalBasket } from "../../components/gb/FinalBasket";
import { FloatingBag } from "../../components/gb/FloatingBag";
import { BagDrawer } from "../../components/gb/BagDrawer";
import { CategoryRail, ProgressBadge } from "../../components/gb/CategoryRail";
import { usePrefersReducedMotion, useSectionScroll } from "../../hooks/useSectionScroll";
import { useAbandonmentTracker } from "../../hooks/useAbandonmentTracker";
import { useAuthSession } from "../../hooks/useAuthSession";
import { GoogleSignInModal } from "../../components/gb/GoogleSignInModal";
import { UserAuthHeader } from "../../components/gb/UserAuthHeader";
import { useBasket } from "../../store/basket";

const TOTAL = categories.length + 2; // intro + 8 worlds + final basket

export default function GreenBasketPage() {
  useAbandonmentTracker();
  const { user, isLoggedIn, loginWithGoogle, logout } = useAuthSession();

  // Sync the SIGNED-IN shopper identity into the basket store so checkout
  // abandonment records (and the 1hr/24hr recovery emails) are linked to the
  // real registered Google email — never the prefilled demo defaults.
  useEffect(() => {
    if (user?.googleVerified && user.email) {
      useBasket.getState().setCustomerInfo({
        customerName: user.name || "Shopper",
        customerEmail: user.email,
      });
    }
  }, [user]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingIndex, setPendingIndex] = useState(1);

  // Strict scroll interception callback for unauthenticated users
  const handleBeforeChange = (next, current) => {
    if (!isLoggedIn && next > 0) {
      setPendingIndex(next);
      setShowAuthModal(true);
      return false; // Blocks the scroll transition!
    }
    return true;
  };

  const { index, goTo } = useSectionScroll(TOTAL, { onBeforeChange: handleBeforeChange });
  const reduced = usePrefersReducedMotion();

  const isIntro = index === 0;
  const isFinal = index === TOTAL - 1;
  const categoryIndex = Math.min(Math.max(index - 1, 0), categories.length - 1);
  const activeCategory = isIntro ? -1 : isFinal ? categories.length : categoryIndex;

  // Intercept explicit start / category rail button clicks
  const handleGoTo = (next) => {
    if (!isLoggedIn && next > 0) {
      setPendingIndex(next);
      setShowAuthModal(true);
      return;
    }
    goTo(next);
  };

  // If user is unauthenticated and somehow on index > 0, enforce white blur modal
  useEffect(() => {
    if (!isLoggedIn && index > 0) {
      setShowAuthModal(true);
    }
  }, [index, isLoggedIn]);

  const handleLoginSuccess = (userData) => {
    loginWithGoogle(userData);
    setShowAuthModal(false);
    goTo(pendingIndex > 0 ? pendingIndex : 1);
  };

  const handleModalClose = () => {
    setShowAuthModal(false);
    goTo(0); // Return to clean intro section
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden text-ink select-none">
      {/* Google User Profile Header (Top-Right) */}
      <UserAuthHeader
        user={user}
        onLogout={logout}
        onSignInClick={() => {
          setPendingIndex(1);
          setShowAuthModal(true);
        }}
      />

      {/* 3D WebGL Background Scene */}
      <Scene categoryIndex={categoryIndex} intro={isIntro} reduced={reduced} />

      {/* Cinematic Vignette + Warm Light Wash */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-[5]"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 10%, rgba(255,244,214,.35), transparent 60%), radial-gradient(120% 120% at 50% 110%, rgba(30,60,30,.28), transparent 55%)",
        }}
      />

      {/* Stacked Full-Viewport Sections with Cinematic Cross-Fade */}
      <div className="relative h-full w-full">
        {Array.from({ length: TOTAL }, (_, i) => {
          const offset = i - index;
          const activeSection = offset === 0;
          if (Math.abs(offset) > 1) return null;
          return (
            <div
              key={i}
              aria-hidden={!activeSection}
              className="absolute inset-0 transition-all duration-[600ms] ease-[cubic-bezier(.16,.84,.24,1)] will-change-transform"
              style={{
                opacity: activeSection ? 1 : 0,
                transform: activeSection
                  ? "translate3d(0,0,0) scale(1)"
                  : `translate3d(0, ${offset * 6}vh, 0) scale(${offset < 0 ? 1.04 : 0.96})`,
                pointerEvents: activeSection ? "auto" : "none",
                display: Math.abs(offset) > 1 ? "none" : "block",
              }}
            >
              {i === 0 ? (
                <Intro onStart={() => handleGoTo(1)} />
              ) : i === TOTAL - 1 ? (
                <FinalBasket />
              ) : (
                <CategoryPanel
                  category={categories[i - 1]}
                  position={`${String(i).padStart(2, "0")} / 08`}
                  active={activeSection}
                />
              )}
            </div>
          );
        })}
      </div>

      {!isIntro && !isFinal && (
        <CategoryRail activeCategory={activeCategory} onSelect={(i) => handleGoTo(i + 1)} />
      )}

      {/* FloatingBag: visible on category worlds, hidden on final basket */}
      {!isIntro && !isFinal && <FloatingBag />}
      <BagDrawer onContinue={() => handleGoTo(TOTAL - 1)} />

      {/* White Blur Screen Overlay & Google Sign In Modal for Unauthenticated Users */}
      <GoogleSignInModal
        isOpen={!isLoggedIn && (showAuthModal || index > 0)}
        onLogin={handleLoginSuccess}
        onClose={handleModalClose}
      />
    </main>
  );
}

