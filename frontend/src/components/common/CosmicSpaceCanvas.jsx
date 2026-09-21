import React, { useEffect, useRef } from 'react';

export const CosmicSpaceCanvas = () => {
  const canvasRef = useRef(null);

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

    // 1. DENSE MULTI-LAYER STARFIELD
    const STAR_COUNT = Math.min(220, Math.floor((width * height) / 6500));
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.4,
      speedX: (Math.random() - 0.5) * 0.12,
      speedY: -(Math.random() * 0.22 + 0.05), // Gentle cosmic upward drift
      opacity: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.025 + 0.008,
      twinklePhase: Math.random() * Math.PI * 2,
      color:
        Math.random() > 0.8
          ? '#6ee7b7'
          : Math.random() > 0.6
          ? '#38bdf8'
          : '#ffffff',
    }));

    // 2. DRIFTING ASTEROIDS & GLOWING SPACE DUST PARTICLES
    const ASTEROID_COUNT = 16;
    const asteroids = Array.from({ length: ASTEROID_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.8 + 1.2,
      speedX: -(Math.random() * 0.4 + 0.15), // Slow drift to the left
      speedY: Math.random() * 0.2 - 0.1,
      trailLength: Math.random() * 30 + 15,
      alpha: Math.random() * 0.65 + 0.35,
      pulsePhase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.35 ? '#ffffff' : '#34d399',
    }));

    // 3. SHOOTING METEORS / COMET STREAKS
    const activeMeteors = [];
    let lastMeteorTime = Date.now();
    let nextMeteorInterval = 2800 + Math.random() * 2500;

    const spawnMeteor = () => {
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3; // ~45 degree diagonal
      const speed = Math.random() * 6 + 5;
      const length = Math.random() * 200 + 120;
      const startX = Math.random() * (width * 0.85) - 50;
      const startY = -60;

      activeMeteors.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length,
        width: Math.random() * 1.8 + 1.2,
        opacity: Math.random() * 0.6 + 0.4,
        color: Math.random() > 0.4 ? '#34d399' : '#38bdf8',
        life: 1.0,
        decay: 0.008,
      });
    };

    // RENDER LOOP
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render Shooting Meteors
      const now = Date.now();
      if (now - lastMeteorTime > nextMeteorInterval) {
        spawnMeteor();
        lastMeteorTime = now;
        nextMeteorInterval = 3000 + Math.random() * 3000;
      }

      for (let i = activeMeteors.length - 1; i >= 0; i--) {
        const m = activeMeteors[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life -= m.decay;

        if (m.life <= 0 || m.x > width + 200 || m.y > height + 200) {
          activeMeteors.splice(i, 1);
          continue;
        }

        const headX = m.x;
        const headY = m.y;
        const tailX = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.length;
        const tailY = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.length;

        const grad = ctx.createLinearGradient(headX, headY, tailX, tailY);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, m.color);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = m.width;
        ctx.lineCap = 'round';
        ctx.globalAlpha = Math.max(0, m.opacity * m.life);
        ctx.shadowBlur = 12;
        ctx.shadowColor = m.color;
        ctx.stroke();

        // Glowing head
        ctx.beginPath();
        ctx.arc(headX, headY, m.width * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 16;
        ctx.shadowColor = m.color;
        ctx.fill();
        ctx.restore();
      }

      // Render Drifting Asteroids
      asteroids.forEach((ast) => {
        ast.x += ast.speedX;
        ast.y += ast.speedY;
        ast.pulsePhase += 0.02;

        if (ast.x < -60) ast.x = width + 60;
        if (ast.x > width + 60) ast.x = -60;
        if (ast.y < -60) ast.y = height + 60;
        if (ast.y > height + 60) ast.y = -60;

        const pulseAlpha = ast.alpha * (0.75 + 0.25 * Math.sin(ast.pulsePhase));

        // Draw asteroid glow
        ctx.save();
        const radGrad = ctx.createRadialGradient(
          ast.x,
          ast.y,
          0,
          ast.x,
          ast.y,
          ast.size * 2.5
        );
        radGrad.addColorStop(0, `rgba(255, 255, 255, ${pulseAlpha})`);
        radGrad.addColorStop(0.4, `${ast.color === '#ffffff' ? 'rgba(255, 255, 255,' : 'rgba(52, 211, 153,'} ${pulseAlpha * 0.4})`);
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(ast.x, ast.y, ast.size * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw soft asteroid tail
        const tailX = ast.x - ast.speedX * ast.trailLength;
        const tailY = ast.y - ast.speedY * ast.trailLength;

        const lineGrad = ctx.createLinearGradient(ast.x, ast.y, tailX, tailY);
        lineGrad.addColorStop(0, `rgba(255, 255, 255, ${pulseAlpha * 0.7})`);
        lineGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.moveTo(ast.x, ast.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = ast.size * 0.6;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      });

      // Render Twinkling Stars
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

        ctx.save();
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, currentOpacity));
        if (star.size > 1.2) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = star.color;
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
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
      style={{ background: 'transparent' }}
    />
  );
};

export default CosmicSpaceCanvas;
