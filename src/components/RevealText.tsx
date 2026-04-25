"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface RevealTextProps {
  text: string;
  className?: string;
  /** Stagger delay between words (seconds) */
  stagger?: number;
  /** Trigger once or every time it enters view */
  once?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

/**
 * Splits text into words and reveals each with a staggered
 * blur-in + slide-up animation triggered by scroll visibility.
 */
export function RevealText({
  text,
  className = "",
  stagger = 0.04,
  once = true,
  as: Tag = "h2",
}: RevealTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-80px 0px" });
  const words = text.split(" ");

  return (
    <Tag
      ref={ref as React.RefObject<HTMLHeadingElement>}
      className={className}
      style={{ display: "flex", flexWrap: "wrap", gap: "0.25em" }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          style={{ display: "inline-block", overflow: "hidden" }}
        >
          <motion.span
            style={{ display: "inline-block" }}
            initial={{ y: "110%", opacity: 0, filter: "blur(8px)" }}
            animate={
              isInView
                ? { y: "0%", opacity: 1, filter: "blur(0px)" }
                : { y: "110%", opacity: 0, filter: "blur(8px)" }
            }
            transition={{
              duration: 0.6,
              delay: i * stagger,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/**
 * Fade-up reveal for paragraphs and blocks of content.
 */
export function RevealBlock({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px 0px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ y: 40, opacity: 0, filter: "blur(6px)" }}
      animate={
        isInView
          ? { y: 0, opacity: 1, filter: "blur(0px)" }
          : { y: 40, opacity: 0, filter: "blur(6px)" }
      }
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
