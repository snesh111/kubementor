import React, { useEffect, useRef } from 'react';

/**
 * High-performance cosmic asteroids and twinkling stars canvas background
 */
export const CosmicAsteroidsBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // 1. Static Twinkling Stars
    const numStars = Math.floor((width * height) / 8000);
    const stars = Array.from({ length: Math.min(numStars, 120) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.2 + 0.3,
      alpha: Math.random() * 0.7 + 0.2,
      speed: Math.random() * 0.02 + 0.005,
      direction: Math.random() > 0.5 ? 1 : -1,
    }));

    // 2. Drifting Asteroids / Glowing Space Particles
    const numAsteroids = 14;
    const asteroids = Array.from({ length: numAsteroids }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 1,
      speedX: -(Math.random() * 0.35 + 0.15), // Slow drift from right to left
      speedY: Math.random() * 0.2 - 0.1,
      trailLength: Math.random() * 25 + 15,
      glowColor: Math.random() > 0.4 ? 'rgba(255, 255, 255,' : 'rgba(16, 185, 129,', // White / emerald faint glow
      alpha: Math.random() * 0.6 + 0.3,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render Stars
      stars.forEach((star) => {
        star.alpha += star.speed * star.direction;
        if (star.alpha > 0.9) {
          star.alpha = 0.9;
          star.direction = -1;
        } else if (star.alpha < 0.15) {
          star.alpha = 0.15;
          star.direction = 1;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.shadowBlur = star.radius > 1 ? 4 : 0;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Render Asteroids with soft trails
      asteroids.forEach((ast) => {
        ast.x += ast.speedX;
        ast.y += ast.speedY;

        // Wrap around borders
        if (ast.x < -50) ast.x = width + 50;
        if (ast.x > width + 50) ast.x = -50;
        if (ast.y < -50) ast.y = height + 50;
        if (ast.y > height + 50) ast.y = -50;

        // Draw soft asteroid head
        const gradient = ctx.createRadialGradient(
          ast.x,
          ast.y,
          0,
          ast.x,
          ast.y,
          ast.size * 2
        );
        gradient.addColorStop(0, `${ast.glowColor} ${ast.alpha})`);
        gradient.addColorStop(0.5, `${ast.glowColor} ${ast.alpha * 0.4})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(ast.x, ast.y, ast.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw faint trailing tail behind asteroid
        const trailX = ast.x - ast.speedX * ast.trailLength;
        const trailY = ast.y - ast.speedY * ast.trailLength;

        const lineGrad = ctx.createLinearGradient(ast.x, ast.y, trailX, trailY);
        lineGrad.addColorStop(0, `${ast.glowColor} ${ast.alpha * 0.8})`);
        lineGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.beginPath();
        ctx.moveTo(ast.x, ast.y);
        ctx.lineTo(trailX, trailY);
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = ast.size * 0.7;
        ctx.lineCap = 'round';
        ctx.stroke();
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
      className="fixed inset-0 pointer-events-none z-0 w-full h-full opacity-70"
    />
  );
};

export default CosmicAsteroidsBackground;
