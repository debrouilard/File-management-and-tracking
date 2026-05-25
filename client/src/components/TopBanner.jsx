import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import aauLogo from "../assets/aau-logo.png";

function ProfileIcon() {
  return (
    <div className="w-9 h-9 rounded-full bg-white border border-line grid place-items-center text-ink-700">
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 20.25a7.5 7.5 0 0115 0"
        />
      </svg>
    </div>
  );
}

export function TopBanner() {
  const { logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-20 bg-gradient-to-r from-brand-bannerFrom to-brand-bannerTo border-b border-line">
      <div className="h-[64px] max-w-7xl mx-auto px-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img
            src={aauLogo}
            alt="AAU logo"
            className="w-10 h-10 object-contain mix-blend-multiply opacity-[0.92] contrast-[1.02]"
          />
          <div className="leading-tight">
            <p className="text-ink-950 font-semibold">AAU</p>
            <p className="text-ink-700 text-xs">Document management system</p>
          </div>
        </Link>

        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            aria-label="Profile menu"
          >
            <ProfileIcon />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-line shadow-lg">
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-brand-hover"
                onClick={() => {
                  setOpen(false);
                  nav("/profile");
                }}
              >
                Profile
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-brand-hover"
                onClick={() => {
                  setOpen(false);
                  logout();
                  nav("/login", { replace: true });
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

