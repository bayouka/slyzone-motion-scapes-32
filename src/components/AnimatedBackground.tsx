
import React, { useEffect, useRef } from 'react';
import { createParticles, updateParticle, type Particle } from '../utils/particleUtils';
import { createHexagons, updateHexagon, type Hexagon } from '../utils/hexagonUtils';
import { createGradientBackground, drawGlow, drawHexagon } from '../utils/canvasUtils';

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const hexagonsRef = useRef<Hexagon[]>([]);
  const requestIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = createParticles(canvas.width, canvas.height);
      hexagonsRef.current = createHexagons(canvas.width, canvas.height);
    };

    const animate = () => {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      createGradientBackground(ctx, canvas.width, canvas.height);

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;

      if (mouseX !== 0 && mouseY !== 0) {
        drawGlow(ctx, mouseX, mouseY, 200, 'rgba(0, 210, 255, 0.03)');
      }

      hexagonsRef.current.forEach(hexagon => {
        updateHexagon(hexagon, mouseX, mouseY, canvas);
        drawHexagon(
          ctx,
          hexagon.x,
          hexagon.y,
          hexagon.size,
          hexagon.rotation,
          hexagon.color.replace(/[\d.]+\)$/, `${hexagon.alpha})`)
        );
      });

      particlesRef.current.forEach(particle => {
        updateParticle(particle, mouseX, mouseY, canvas);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace(/[\d.]+\)$/, `${particle.alpha})`);
        ctx.fill();
        drawGlow(ctx, particle.x, particle.y, particle.size * 2, particle.color.replace(/[\d.]+\)$/, `${particle.alpha * 0.5})`));
      });

      requestIdRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = {
        x: event.clientX,
        y: event.clientY
      };
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestIdRef.current !== null) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="full-screen" />;
};

export default AnimatedBackground;

