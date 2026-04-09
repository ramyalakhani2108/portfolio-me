"use client";
import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Hide default cursor
    document.body.style.cursor = "none";

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let isHovering = false;
    let isPressed = false;
    let rafId: number;

    const LERP = 0.1;

    const interactiveSelector =
      "a, button, [role='button'], input, select, textarea";

    // Direct mouse tracking for dot (no delay)
    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Dot follows exactly
      dot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px) scale(${isPressed ? 0.6 : 1})`;
    };

    const onMouseDown = () => {
      isPressed = true;
      dot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px) scale(0.6)`;
      ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px) scale(${isHovering ? 1.5 * 0.85 : 0.85})`;
    };

    const onMouseUp = () => {
      isPressed = false;
      dot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px) scale(1)`;
      ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px) scale(${isHovering ? 1.5 : 1})`;
    };

    const onMouseEnterInteractive = () => {
      isHovering = true;
      ring.style.backgroundColor = "rgba(198,168,107,0.15)";
      ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px) scale(${isPressed ? 1.5 * 0.85 : 1.5})`;
    };

    const onMouseLeaveInteractive = () => {
      isHovering = false;
      ring.style.backgroundColor = "transparent";
      ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px) scale(${isPressed ? 0.85 : 1})`;
    };

    // Attach hover listeners via event delegation
    const onMouseOver = (e: MouseEvent) => {
      if ((e.target as Element).closest(interactiveSelector)) {
        onMouseEnterInteractive();
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as Element;
      const related = e.relatedTarget as Element | null;
      if (
        target.closest(interactiveSelector) &&
        (!related || !related.closest(interactiveSelector))
      ) {
        onMouseLeaveInteractive();
      }
    };

    // RAF loop for ring lerp
    const animate = () => {
      ringX += (mouseX - ringX) * LERP;
      ringY += (mouseY - ringY) * LERP;

      const scale = isHovering ? (isPressed ? 1.5 * 0.85 : 1.5) : isPressed ? 0.85 : 1;
      ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px) scale(${scale})`;

      rafId = requestAnimationFrame(animate);
    };

    // Show cursors once mouse moves into window
    const onMouseEnterWindow = () => {
      dot.style.opacity = "1";
      ring.style.opacity = "0.7";
    };

    const onMouseLeaveWindow = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);
    document.documentElement.addEventListener("mouseenter", onMouseEnterWindow);
    document.documentElement.addEventListener("mouseleave", onMouseLeaveWindow);

    rafId = requestAnimationFrame(animate);

    return () => {
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      document.documentElement.removeEventListener("mouseenter", onMouseEnterWindow);
      document.documentElement.removeEventListener("mouseleave", onMouseLeaveWindow);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Inner dot — follows mouse exactly */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: "#C6A86B",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0,
          willChange: "transform",
          transition: "transform 0.08s ease, opacity 0.2s ease",
        }}
      />

      {/* Outer ring — lerp-smoothed follow */}
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "2px solid #C6A86B",
          backgroundColor: "transparent",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0,
          willChange: "transform",
          transition:
            "transform 0.15s ease, background-color 0.2s ease, opacity 0.2s ease",
        }}
      />
    </>
  );
}

export default CustomCursor;
