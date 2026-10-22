"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, type ReactNode } from "react";

// Purl: Weft's mascot. A small ball of yarn wound from the four thread colors,
// who "weaves" your week and narrates it. Pure SVG so it scales and themes cleanly.

export type PurlMood = "happy" | "wave" | "excited" | "sleepy" | "thinking" | "proud";

const INK = "#2B2230";
const LINE = "#3A2E36";

export function Purl({
  mood = "happy",
  size = 96,
  className = "",
  still = false,
  title = "Purl, the Weft mascot",
}: {
  mood?: PurlMood;
  size?: number;
  className?: string;
  still?: boolean;
  title?: string;
}) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const animate = !still && !reduce;
  const eyesClosed = mood === "sleepy";
  const lookUp = mood === "thinking";

  return (
    <motion.svg
      viewBox="0 0 132 132"
      width={size}
      height={size}
      className={`overflow-visible ${className}`}
      role="img"
      aria-label={title}
      animate={animate ? { y: [0, -4, 0] } : undefined}
      transition={{ duration: mood === "sleepy" ? 3.6 : 2.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <radialGradient id={`purl-body-${uid}`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#FFF4E4" />
          <stop offset="0.6" stopColor="#FFE2C2" />
          <stop offset="1" stopColor="#F4C49C" />
        </radialGradient>
        <clipPath id={`purl-clip-${uid}`}>
          <circle cx="60" cy="62" r="41" />
        </clipPath>
      </defs>

      {/* shadow */}
      <ellipse cx="60" cy="114" rx="30" ry="5" fill={INK} opacity="0.12" />

      {/* loose thread tail */}
      <motion.path
        d="M 98 80 C 114 86, 108 106, 124 112"
        fill="none"
        stroke="#8B6CF6"
        strokeWidth="3"
        strokeLinecap="round"
        animate={animate ? { d: ["M 98 80 C 114 86, 108 106, 124 112", "M 98 80 C 116 90, 104 104, 124 116", "M 98 80 C 114 86, 108 106, 124 112"] } : undefined}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* feet */}
      <ellipse cx="47" cy="104" rx="9" ry="5" fill={LINE} />
      <ellipse cx="73" cy="104" rx="9" ry="5" fill={LINE} />

      {/* left arm */}
      <path d="M 21 70 Q 9 70 8 58" fill="none" stroke={LINE} strokeWidth="3.2" strokeLinecap="round" />
      {/* right arm (waves) */}
      <motion.path
        d={mood === "wave" || mood === "excited" ? "M 99 66 Q 112 58 110 44" : "M 99 70 Q 111 70 112 58"}
        fill="none"
        stroke={LINE}
        strokeWidth="3.2"
        strokeLinecap="round"
        style={{ originX: "99px", originY: "66px" }}
        animate={animate && (mood === "wave" || mood === "excited") ? { rotate: [0, -18, 6, -18, 0] } : undefined}
        transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
      />

      {/* body */}
      <circle cx="60" cy="62" r="41" fill={`url(#purl-body-${uid})`} />
      <g clipPath={`url(#purl-clip-${uid})`} fill="none" strokeLinecap="round">
        <path d="M 12 44 Q 60 12 108 44" stroke="#8B6CF6" strokeWidth="4" />
        <path d="M 12 51 Q 60 21 108 51" stroke="#F5A524" strokeWidth="3.4" opacity="0.9" />
        <path d="M 14 58 Q 60 31 106 58" stroke="#8B6CF6" strokeWidth="2" opacity="0.45" />
        <path d="M 16 90 Q 60 118 104 90" stroke="#1FB98A" strokeWidth="4" />
        <path d="M 18 84 Q 60 108 102 84" stroke="#F2546A" strokeWidth="3.2" opacity="0.9" />
        <path d="M 30 26 Q 13 62 30 98" stroke="#F5A524" strokeWidth="3" opacity="0.75" />
        <path d="M 90 26 Q 107 62 90 98" stroke="#F2546A" strokeWidth="3" opacity="0.75" />
      </g>
      <circle cx="60" cy="62" r="41" fill="none" stroke={LINE} strokeWidth="2.6" />

      {/* cheeks */}
      <ellipse cx="40" cy="73" rx="6.5" ry="3.6" fill="#F2546A" opacity="0.32" />
      <ellipse cx="80" cy="73" rx="6.5" ry="3.6" fill="#F2546A" opacity="0.32" />

      {/* eyes */}
      {eyesClosed ? (
        <g fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round">
          <path d="M 44 65 Q 49 69 54 65" />
          <path d="M 66 65 Q 71 69 76 65" />
        </g>
      ) : (
        <motion.g
          style={{ originY: "63px" }}
          animate={animate ? { scaleY: [1, 1, 0.1, 1, 1] } : undefined}
          transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }}
        >
          {mood === "proud" ? (
            <g fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round">
              <path d="M 44 65 Q 49 59 54 65" />
              <path d="M 66 65 Q 71 59 76 65" />
            </g>
          ) : (
            <>
              <ellipse cx="49" cy={lookUp ? 60 : 63} rx="4.2" ry="5.4" fill={INK} />
              <ellipse cx="71" cy={lookUp ? 60 : 63} rx="4.2" ry="5.4" fill={INK} />
              <circle cx="50.5" cy={lookUp ? 58 : 61} r="1.5" fill="#fff" />
              <circle cx="72.5" cy={lookUp ? 58 : 61} r="1.5" fill="#fff" />
            </>
          )}
        </motion.g>
      )}

      {/* mouth */}
      {mood === "excited" ? (
        <g>
          <path d="M 53 74 Q 60 86 67 74 Z" fill={INK} />
          <ellipse cx="60" cy="80.5" rx="3.4" ry="2" fill="#F2546A" />
        </g>
      ) : mood === "sleepy" ? (
        <ellipse cx="60" cy="77" rx="2.4" ry="2.8" fill={INK} />
      ) : mood === "thinking" ? (
        <path d="M 55 77 Q 60 75 66 76" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      ) : (
        <path d="M 53 74 Q 60 81 67 74" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      )}

      {/* mood extras */}
      {mood === "sleepy" && (
        <motion.text
          x="94"
          y="30"
          fontFamily="var(--font-instrument-serif), Georgia, serif"
          fontStyle="italic"
          fontSize="18"
          fill="#6847D6"
          animate={animate ? { y: [30, 20, 30], opacity: [0.2, 1, 0.2] } : undefined}
          transition={{ duration: 2.8, repeat: Infinity }}
        >
          z
        </motion.text>
      )}
      {mood === "thinking" && (
        <g fill="#9D9389">
          <circle cx="100" cy="28" r="2.4" />
          <circle cx="108" cy="19" r="3.4" />
          <circle cx="118" cy="8" r="4.6" />
        </g>
      )}
      {(mood === "excited" || mood === "proud") && (
        <motion.g
          fill="#F5A524"
          animate={animate ? { scale: [0.8, 1.15, 0.8], opacity: [0.6, 1, 0.6] } : undefined}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{ originX: "16px", originY: "22px" }}
        >
          <path d="M 16 12 L 18.5 19.5 L 26 22 L 18.5 24.5 L 16 32 L 13.5 24.5 L 6 22 L 13.5 19.5 Z" />
        </motion.g>
      )}
    </motion.svg>
  );
}

export function PurlSays({
  mood,
  size = 72,
  children,
  className = "",
  side = "right",
}: {
  mood?: PurlMood;
  size?: number;
  children: ReactNode;
  className?: string;
  side?: "right" | "left";
}) {
  return (
    <div className={`flex items-end gap-3 ${side === "left" ? "flex-row-reverse" : ""} ${className}`}>
      <Purl mood={mood} size={size} className="shrink-0" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        className={`relative mb-5 rounded-2xl border border-loom-3 bg-loom-2 px-4 py-3 text-[15px] leading-snug text-bone shadow-[var(--shadow-soft)] ${
          side === "left" ? "origin-bottom-right" : "origin-bottom-left"
        }`}
      >
        <span
          aria-hidden
          className={`absolute bottom-3 h-3 w-3 rotate-45 border-loom-3 bg-loom-2 ${
            side === "left" ? "-right-1.5 border-r border-t" : "-left-1.5 border-b border-l"
          }`}
        />
        {children}
      </motion.div>
    </div>
  );
}
