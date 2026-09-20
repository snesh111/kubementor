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

    // 1. MULTI-LAYER STARFIELD
    const STAR_COUNT = Math.min(160, Math.floor((width * height) / 9000));
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.6 + 0.4,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: -(Math.random() * 0.25 + 0.08), // Gentle cosmic upward drift
      opacity: Math.random() * 0.75 + 0.25,
      twinkleSpeed: Math.random() * 0.02 + 0.008,
      twinklePhase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.75 ? '#6ee7b7' : Math.random() > 0.5 ? '#7dd3fc' : '#ffffff',
    }));

    // 2. DEEP SPACE COSMIC LIGHT BEAMS / SHOOTING ENERGY STREAKS (Behind the scenes)
    const activeBeams = [];
    let lastBeamTime = Date.now();
    let nextBeamInterval = 2200 + Math.random() * 2000;

    const spawnCosmicLightBeam = (options = {}) => {
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.35; // ~45 degree diagonal travel
      const speed = Math.random() * 5 + 4.5;
      const length = Math.random() * 220 + 140;
      const startX = options.x !== undefined ? options.x : Math.random() * (width * 0.8) - 100;
      const startY = options.y !== undefined ? options.y : -80;

      activeBeams.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length,
        width: Math.random() * 1.8 + 1.2,
        opacity: Math.random() * 0.55 + 0.35,
        color: Math.random() > 0.5 ? '#34d399' : '#38bdf8', // Emerald or Cyan
        life: 1.0,
        decay: 0.007,
      });
    };

    // 3. AMBIENT NEBULA GLOW WAVES (Deep space backdrop lighting)
    let nebulaPhase = 0;

    // RENDER LOOP
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      nebulaPhase += 0.008;

      // Draw subtle deep space nebula lighting in the background
      const nebulaGlow = ctx.createRadialGradient(
        width * 0.5 + Math.sin(nebulaPhase * 0.5) * 120,
        height * 0.25 + Math.cos(nebulaPhase * 0.4) * 80,
        40,
        width * 0.5,
        height * 0.3,
        width * 0.6
      );
      nebulaGlow.addColorStop(0, 'rgba(16, 185, 129, 0.035)');
      nebulaGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.02)');
      nebulaGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebulaGlow;
      ctx.fillRect(0, 0, width, height);

      // Spawn periodic cosmic light beams behind the scene
      const now = Date.now();
      if (now - lastBeamTime > nextBeamInterval) {
        spawnCosmicLightBeam();
        lastBeamTime = now;
        nextBeamInterval = 2500 + Math.random() * 2800;
      }

      // Draw and animate Deep Cosmic Light Beams
      for (let i = activeBeams.length - 1; i >= 0; i--) {
        const beam = activeBeams[i];
        beam.x += beam.vx;
        beam.y += beam.vy;
        beam.life -= beam.decay;

        if (beam.life <= 0 || beam.x > width + 200 || beam.y > height + 200) {
          activeBeams.splice(i, 1);
          continue;
        }

        const headX = beam.x;
        const headY = beam.y;
        const tailX = beam.x - (beam.vx / Math.hypot(beam.vx, beam.vy)) * beam.length;
        const tailY = beam.y - (beam.vy / Math.hypot(beam.vx, beam.vy)) * beam.length;

        // Gradient for the smooth light beam
        const beamGrad = ctx.createLinearGradient(headX, headY, tailX, tailY);
        beamGrad.addColorStop(0, '#ffffff');
        beamGrad.addColorStop(0.25, beam.color);
        beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = beamGrad;
        ctx.lineWidth = beam.width;
        ctx.lineCap = 'round';
        ctx.globalAlpha = Math.max(0, beam.opacity * beam.life);
        ctx.shadowBlur = 14;
        ctx.shadowColor = beam.color;
        ctx.stroke();

        // Soft glowing head point
        ctx.beginPath();
        ctx.arc(headX, headY, beam.width * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = Math.max(0, beam.opacity * beam.life * 0.9);
        ctx.shadowBlur = 18;
        ctx.shadowColor = beam.color;
        ctx.fill();

        ctx.restore();
      }

      // Draw and animate Stars
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

        const currentOpacity = star.opacity * (0.65 + 0.35 * Math.sin(star.twinklePhase));

        ctx.save();
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, currentOpacity));
        if (star.size > 1.1) {
          ctx.shadowBlur = 5;
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
      className="fixed inset-0 pointer-events-none -z-10 opacity-90"
      style={{ background: 'transparent' }}
    />
  );
};

export default CosmicSpaceCanvas;
