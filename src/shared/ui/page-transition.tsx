"use client";

import { motion } from "framer-motion";
import { PAGE_TRANSITION } from "@/shared/lib/motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={PAGE_TRANSITION}
    >
      {children}
    </motion.div>
  );
}
