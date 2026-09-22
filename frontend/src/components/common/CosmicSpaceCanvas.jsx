import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

export const CosmicSpaceCanvas = () => {
  const canvasRef = useRef(null);
  const { isDarkMode } = useTheme();
  const isDarkModeRef = useRef(isDarkMode);

  // Keep isDarkMode ref updated for the animation loop
  useEffect(() => {
    isDarkModeRef.current = isDarkMode;
  }, [isDarkMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 1. STAR & AMBIENT SPARK PARTICLES
    const STAR_COUNT = Math.min(180, Math.floor((width * height) / 8000));
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.5,
      speedX: (Math.random() - 0.5) * 0.12,
      speedY: -(Math.random() * 0.22 + 0.05),
      opacity: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.025 + 0.008,
      twinklePhase: Math.random() * Math.PI * 2,
      darkColor:
        Math.random() > 0.7
          ? '#34d399'
          : Math.random() > 0.4
          ? '#38bdf8'
          : '#ffffff',
      lightColor:
        Math.random() > 0.6
          ? '#059669' // Emerald
          : Math.random() > 0.3
          ? '#0284c7' // Cyan
          : '#6366f1', // Indigo
    }));

    // 2. DRIFTING GLOWING ASTEROID / SPARK ORBS
    const ASTEROID_COUNT = 14;
    const asteroids = Array.from({ length: ASTEROID_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 1.2,
      speedX: -(Math.random() * 0.35 + 0.12),
      speedY: Math.random() * 0.18 - 0.09,
      trailLength: Math.random() * 28 + 14,
      alpha: Math.random() * 0.6 + 0.4,
      pulsePhase: Math.random() * Math.PI * 2,
      darkColor: Math.random() > 0.4 ? '#34d399' : '#38bdf8',
      lightColor: Math.random() > 0.4 ? '#059669' : '#0284c7',
    }));

    // 3. ENERGETIC SHOOTING METEORS / COMET STREAKS ("STRIKERS")
    const activeMeteors = [];
    let lastMeteorTime = Date.now();
    let nextMeteorInterval = 1200 + Math.random() * 1500; // Frequent streaks every 1.2-2.7s

    const spawnMeteor = () => {
      const isDark = isDarkModeRef.current;
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.35; // ~45 degree diagonal
      const speed = Math.random() * 7 + 6;
      const length = Math.random() * 240 + 140;
      const startX = Math.random() * (width * 0.9) - 80;
      const startY = -80;

      const darkPalette = ['#10b981', '#34d399', '#38bdf8', '#a78bfa'];
      const lightPalette = ['#059669', '#047857', '#0284c7', '#2563eb', '#7c3aed'];

      const chosenColor = isDark
        ? darkPalette[Math.floor(Math.random() * darkPalette.length)]
        : lightPalette[Math.floor(Math.random() * lightPalette.length)];

      activeMeteors.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length,
        width: Math.random() * 2.2 + 1.4,
        opacity: isDark ? 0.95 : 0.85,
        color: chosenColor,
        life: 1.0,
        decay: 0.007,
      });
    };

    // Spawn 1 initial meteor on load
    spawnMeteor();

    // RENDER LOOP
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const isDark = isDarkModeRef.current;

      // Spawn Shooting Meteors on regular timer
      const now = Date.now();
      if (now - lastMeteorTime > nextMeteorInterval) {
        spawnMeteor();
        lastMeteorTime = now;
        nextMeteorInterval = 1400 + Math.random() * 1800;
      }

      // 1. Render Shooting Meteors / Streaks ("Strikers")
      for (let i = activeMeteors.length - 1; i >= 0; i--) {
        const m = activeMeteors[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life -= m.decay;

        if (m.life <= 0 || m.x > width + 250 || m.y > height + 250) {
          activeMeteors.splice(i, 1);
          continue;
        }

        const headX = m.x;
        const headY = m.y;
        const tailX = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.length;
        const tailY = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.length;

        const grad = ctx.createLinearGradient(headX, headY, tailX, tailY);
        if (isDark) {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.2, m.color);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          // In Light Theme: Bold, vibrant color at head tapering to transparent
          grad.addColorStop(0, m.color);
          grad.addColorStop(0.35, m.color);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = isDark ? m.width : m.width * 1.3;
        ctx.lineCap = 'round';
        ctx.globalAlpha = Math.max(0, m.opacity * m.life);
        ctx.shadowBlur = isDark ? 14 : 10;
        ctx.shadowColor = m.color;
        ctx.stroke();

        // Glowing streak head
        ctx.beginPath();
        ctx.arc(headX, headY, isDark ? m.width * 1.5 : m.width * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#ffffff' : m.color;
        ctx.shadowBlur = isDark ? 16 : 12;
        ctx.shadowColor = m.color;
        ctx.fill();
        ctx.restore();
      }

      // 2. Render Drifting Asteroids / Sparks
      asteroids.forEach((ast) => {
        ast.x += ast.speedX;
        ast.y += ast.speedY;
        ast.pulsePhase += 0.02;

        if (ast.x < -60) ast.x = width + 60;
        if (ast.x > width + 60) ast.x = -60;
        if (ast.y < -60) ast.y = height + 60;
        if (ast.y > height + 60) ast.y = -60;

        const pulseAlpha = ast.alpha * (0.75 + 0.25 * Math.sin(ast.pulsePhase));
        const color = isDark ? ast.darkColor : ast.lightColor;

        ctx.save();
        const radGrad = ctx.createRadialGradient(
          ast.x,
          ast.y,
          0,
          ast.x,
          ast.y,
          ast.size * 2.8
        );
        if (isDark) {
          radGrad.addColorStop(0, `rgba(255, 255, 255, ${pulseAlpha})`);
          radGrad.addColorStop(0.4, `rgba(52, 211, 153, ${pulseAlpha * 0.5})`);
          radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          radGrad.addColorStop(0, `rgba(5, 150, 105, ${pulseAlpha * 0.7})`);
          radGrad.addColorStop(0.5, `rgba(2, 132, 199, ${pulseAlpha * 0.3})`);
          radGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(ast.x, ast.y, ast.size * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Soft trailing streak tail
        const tailX = ast.x - ast.speedX * ast.trailLength;
        const tailY = ast.y - ast.speedY * ast.trailLength;

        const lineGrad = ctx.createLinearGradient(ast.x, ast.y, tailX, tailY);
        if (isDark) {
          lineGrad.addColorStop(0, `rgba(52, 211, 153, ${pulseAlpha * 0.6})`);
          lineGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          lineGrad.addColorStop(0, `rgba(5, 150, 105, ${pulseAlpha * 0.5})`);
          lineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        ctx.beginPath();
        ctx.moveTo(ast.x, ast.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = ast.size * 0.8;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      });

      // 3. Render Twinkling Stars & Ambient Glow Points
      stars.forEach((star) => {
        star.x += star.speedX;
        star.y += star.speedY;
        star.twinklePhase += star.twinkleSpeed;

        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;

        const currentOpacity = star.opacity * (0.6 + 0.4 * Math.sin(star.twinklePhase));
        const color = isDark ? star.darkColor : star.lightColor;

        ctx.save();
        ctx.beginPath();
        ctx.arc(star.x, star.y, isDark ? star.size : star.size * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = Math.max(0.15, Math.min(1, isDark ? currentOpacity : currentOpacity * 0.45));
        if (star.size > 1.2 && isDark) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = color;
        }
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-300 ${
        isDarkMode ? 'opacity-90' : 'opacity-85'
      }`}
      style={{ background: 'transparent' }}
    />
  );
};

export default CosmicSpaceCanvas;
