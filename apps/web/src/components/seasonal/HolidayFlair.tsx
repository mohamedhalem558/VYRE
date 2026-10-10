import React, { useEffect, useRef } from "react";
import { useStoreSettings } from "../../context/StoreSettingsContext.js";

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wind: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

export const HolidayFlair: React.FC = () => {
  const { isHolidayTheme, settings } = useStoreSettings();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isHolidayTheme) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const particleCount =
      settings.snowIntensity === "light"
        ? 28
        : settings.snowIntensity === "heavy"
        ? 75
        : 45;

    const snowflakes: Snowflake[] = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 1,
      speed: Math.random() * 0.8 + 0.3,
      wind: Math.random() * 0.4 - 0.2,
      opacity: Math.random() * 0.5 + 0.2,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.02 + 0.005,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < snowflakes.length; i++) {
        const flake = snowflakes[i];

        flake.wobble += flake.wobbleSpeed;
        flake.y += flake.speed;
        flake.x += flake.wind + Math.sin(flake.wobble) * 0.4;

        // Reset if off bottom or sides
        if (flake.y > height) {
          flake.y = -5;
          flake.x = Math.random() * width;
        }
        if (flake.x > width) {
          flake.x = 0;
        } else if (flake.x < 0) {
          flake.x = width;
        }

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 245, 255, ${flake.opacity})`;
        ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
        ctx.shadowBlur = 3;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHolidayTheme, settings.snowIntensity]);

  if (!isHolidayTheme) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-1000"
      style={{ opacity: 0.85 }}
      aria-hidden="true"
    />
  );
};
