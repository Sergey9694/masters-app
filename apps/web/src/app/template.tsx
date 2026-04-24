"use client";

import { motion } from "framer-motion";
import { pageTransition } from "@/shared/lib/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={pageTransition}
      className="w-full min-h-screen"
      style={{ willChange: "opacity" }}
    >
      {children}
    </motion.div>
  );
}
