"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PAGE_TRANSITION } from "@/shared/lib/motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={PAGE_TRANSITION}
      className="w-full min-h-screen"
      style={{ willChange: "opacity, filter" }}
    >
      {children}
    </motion.div>
  );
}
