"use client";

import { motion } from "framer-motion";
import { slideUp } from "@/shared/lib/motion";

export default function MainTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={slideUp}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
