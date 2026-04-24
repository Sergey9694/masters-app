"use client";

import { motion } from "framer-motion";
import { scaleIn } from "@/shared/lib/motion";

export default function AuthTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={scaleIn}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
