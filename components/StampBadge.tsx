"use client";
import { motion, useReducedMotion } from "framer-motion";

export function StampBadge({ ok, animateKey }: { ok: boolean; animateKey: number | string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      key={`${animateKey}-${ok}`}
      initial={reduce ? false : { scale: 0.6, rotate: 6, opacity: 0 }}
      animate={{ scale: 1, rotate: -2, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 17 }}
      className={`inline-block rounded-[6px] border-2 px-2.5 py-0.5 font-display text-xs font-bold tracking-[0.08em] ${
        ok ? "border-viridian text-viridian" : "border-violation text-violation"
      }`}
    >
      {ok ? "ON STANDARD" : "OFF STANDARD"}
    </motion.span>
  );
}
