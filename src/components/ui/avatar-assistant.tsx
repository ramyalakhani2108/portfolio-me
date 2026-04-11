"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AvatarAssistantProps {
  onAccept: () => void;
  onDecline: () => void;
}

type Phase = "idle" | "accepting" | "declining" | "hidden";

export function AvatarAssistant({ onAccept, onDecline }: AvatarAssistantProps) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [bubbleText, setBubbleText] = useState("May I speak with you?");

  // Delay initial appearance by 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  function handleAccept() {
    setPhase("accepting");
    setBubbleText("Opening chat! 🎉");
    setTimeout(() => {
      setVisible(false);
    }, 1500);
    setTimeout(() => {
      onAccept();
    }, 1700);
  }

  function handleDecline() {
    setPhase("declining");
    setTimeout(() => {
      setVisible(false);
    }, 800);
    setTimeout(() => {
      onDecline();
    }, 1000);
  }

  const avatarAnimClass =
    phase === "accepting"
      ? "avatar-wave-enthusiastic"
      : phase === "declining"
        ? "avatar-wave-goodbye"
        : "";

  return (
    <>
      <style>{`
        @keyframes avatarFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        @keyframes eyeBlink {
          0%, 92%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.1); }
        }

        @keyframes armWave {
          0%, 100% { transform: rotate(-20deg); }
          50% { transform: rotate(20deg); }
        }

        @keyframes armWaveEnthusiastic {
          0%, 100% { transform: rotate(-35deg); }
          50% { transform: rotate(35deg); }
        }

        @keyframes armWaveGoodbye {
          0% { transform: rotate(-10deg); }
          25% { transform: rotate(20deg); }
          50% { transform: rotate(-10deg); }
          75% { transform: rotate(20deg); }
          100% { transform: rotate(-30deg); }
        }

        .avatar-float {
          animation: avatarFloat 3s ease-in-out infinite;
        }

        .avatar-wave-enthusiastic .avatar-float {
          animation: avatarFloat 1s ease-in-out infinite;
          transform: scale(1.1);
        }

        .eye-blink {
          animation: eyeBlink 4s ease-in-out infinite;
          transform-origin: center;
        }

        .eye-blink-delay {
          animation: eyeBlink 4s ease-in-out infinite 0.1s;
          transform-origin: center;
        }

        .arm-wave {
          animation: armWave 1.2s ease-in-out infinite;
          transform-origin: 5px 5px;
        }

        .avatar-wave-enthusiastic .arm-wave {
          animation: armWaveEnthusiastic 0.5s ease-in-out infinite;
        }

        .avatar-wave-goodbye .arm-wave {
          animation: armWaveGoodbye 0.8s ease-in-out 2;
        }
      `}</style>

      <AnimatePresence>
        {visible && (
          <motion.div
            key="avatar-assistant"
            className="fixed bottom-[88px] right-2 sm:right-4 z-50 hidden md:flex items-end gap-2"
            initial={{ opacity: 0, y: 40, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            {/* Speech bubble — sits to the left of the avatar */}
            <motion.div
              className="relative mb-2"
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 20 }}
            >
              {/* Bubble body */}
              <div
                style={{
                  background: "#111111",
                  border: "1px solid rgba(198, 168, 107, 0.30)",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  maxWidth: "180px",
                  minWidth: "160px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                }}
              >
                <p
                  style={{
                    color: "#F5F1E8",
                    fontSize: "13px",
                    fontWeight: 500,
                    lineHeight: "1.4",
                    marginBottom: "10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {bubbleText}
                </p>

                {phase === "idle" && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    {/* Yes button */}
                    <button
                      onClick={handleAccept}
                      style={{
                        background: "#C6A86B",
                        color: "#0B0B0C",
                        border: "none",
                        borderRadius: "8px",
                        padding: "5px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "opacity 0.15s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
                      }
                    >
                      Yes!
                    </button>

                    {/* Maybe later button */}
                    <button
                      onClick={handleDecline}
                      style={{
                        background: "transparent",
                        color: "#C6A86B",
                        border: "1px solid rgba(198, 168, 107, 0.35)",
                        borderRadius: "8px",
                        padding: "5px 10px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "border-color 0.15s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.borderColor =
                          "rgba(198, 168, 107, 0.7)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.borderColor =
                          "rgba(198, 168, 107, 0.35)")
                      }
                    >
                      Maybe later
                    </button>
                  </div>
                )}
              </div>

              {/* Triangle pointer on RIGHT side of bubble pointing toward avatar */}
              <div
                style={{
                  position: "absolute",
                  right: "-9px",
                  bottom: "18px",
                  width: 0,
                  height: 0,
                  borderTop: "8px solid transparent",
                  borderBottom: "8px solid transparent",
                  borderLeft: "9px solid rgba(198, 168, 107, 0.30)",
                }}
              />
              {/* Inner triangle to cover border gap */}
              <div
                style={{
                  position: "absolute",
                  right: "-7px",
                  bottom: "19px",
                  width: 0,
                  height: 0,
                  borderTop: "7px solid transparent",
                  borderBottom: "7px solid transparent",
                  borderLeft: "8px solid #111111",
                }}
              />
            </motion.div>

            {/* Avatar SVG character */}
            <div className={`avatar-float ${avatarAnimClass}`}>
              <svg
                width="88"
                height="108"
                viewBox="0 0 88 108"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ overflow: "visible" }}
              >
                {/* ── Body ── */}
                <rect
                  x="22"
                  y="58"
                  width="44"
                  height="38"
                  rx="10"
                  fill="#C6A86B"
                />

                {/* ── LEFT arm (hangs down) ── */}
                <rect
                  x="10"
                  y="60"
                  width="13"
                  height="26"
                  rx="6"
                  fill="#C6A86B"
                />
                {/* Left hand */}
                <circle cx="16" cy="90" r="6" fill="#E8C98A" />

                {/* ── RIGHT arm (waves) ── animated group ── */}
                <g
                  className="arm-wave"
                  style={{
                    transformOrigin: "65px 63px",
                  }}
                >
                  <rect
                    x="65"
                    y="43"
                    width="13"
                    height="26"
                    rx="6"
                    fill="#C6A86B"
                  />
                  {/* Right hand */}
                  <circle cx="71" cy="40" r="6" fill="#E8C98A" />
                  {/* Small wave lines beside the hand */}
                  <line
                    x1="79"
                    y1="32"
                    x2="83"
                    y2="28"
                    stroke="#C6A86B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                  <line
                    x1="81"
                    y1="38"
                    x2="86"
                    y2="36"
                    stroke="#C6A86B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                </g>

                {/* ── Neck ── */}
                <rect x="36" y="50" width="16" height="12" rx="4" fill="#E8C98A" />

                {/* ── Head ── */}
                <circle cx="44" cy="36" r="24" fill="#E8C98A" />

                {/* ── Hair ── two small arcs at the top ── */}
                <ellipse cx="32" cy="14" rx="9" ry="6" fill="#5C3D1E" />
                <ellipse cx="44" cy="12" rx="12" ry="7" fill="#5C3D1E" />
                <ellipse cx="56" cy="14" rx="9" ry="6" fill="#5C3D1E" />

                {/* ── Eyes (with blink animation) ── */}
                <g className="eye-blink" style={{ transformOrigin: "35px 34px" }}>
                  <circle cx="35" cy="34" r="4" fill="#2A1A0A" />
                  {/* Eye shine */}
                  <circle cx="36.5" cy="32.5" r="1.2" fill="white" />
                </g>
                <g className="eye-blink-delay" style={{ transformOrigin: "53px 34px" }}>
                  <circle cx="53" cy="34" r="4" fill="#2A1A0A" />
                  {/* Eye shine */}
                  <circle cx="54.5" cy="32.5" r="1.2" fill="white" />
                </g>

                {/* ── Smile ── */}
                <path
                  d="M 36 43 Q 44 50 52 43"
                  stroke="#5C3D1E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* ── Rosy cheeks ── */}
                <ellipse cx="29" cy="40" rx="5" ry="3" fill="#E8A090" opacity="0.45" />
                <ellipse cx="59" cy="40" rx="5" ry="3" fill="#E8A090" opacity="0.45" />

                {/* ── Body detail: collar / lapel lines ── */}
                <line
                  x1="40"
                  y1="63"
                  x2="36"
                  y2="80"
                  stroke="rgba(0,0,0,0.15)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="48"
                  y1="63"
                  x2="52"
                  y2="80"
                  stroke="rgba(0,0,0,0.15)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* ── Legs / feet ── */}
                <rect x="28" y="93" width="13" height="14" rx="6" fill="#3A2A1A" />
                <rect x="47" y="93" width="13" height="14" rx="6" fill="#3A2A1A" />

                {/* Shoe tips */}
                <ellipse cx="34" cy="107" rx="8" ry="4" fill="#2A1A0A" />
                <ellipse cx="53" cy="107" rx="8" ry="4" fill="#2A1A0A" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AvatarAssistant;
