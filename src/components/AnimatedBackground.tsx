
import React, { useEffect, useRef } from 'react';
import { createDustParticles, updateDustParticle, type DustParticle } from '../utils/dustParticleUtils';
import { createFluidLayers, updateFluidLayer, type FluidLayer } from '../utils/fluidLayerUtils';
import { createGradientBackground, drawGlow, drawFluidShape } from '../utils/canvasUtils';

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dustParticlesRef = useRef<DustParticle[]>([]);
  const fluidLayersRef = useRef<FluidLayer[]>([]);
  const requestIdRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      dustParticlesRef.current = createDustParticles(canvas.width, canvas.height);
      fluidLayersRef.current = createFluidLayers(canvas.width, canvas.height);
    };

    const animate = (timestamp: number) => {
      if (!canvas || !ctx) return;
      
      timeRef.current = timestamp;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      createGradientBackground(ctx, canvas.width, canvas.height);

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;

      // Draw fluid layers (behind dust particles)
      fluidLayersRef.current.forEach(layer => {
        updateFluidLayer(layer, mouseX, mouseY, canvas, timestamp);
        ctx.globalAlpha = layer.alpha;
        drawFluidShape(
          ctx,
          layer.x,
          layer.y,
          layer.size,
          layer.rotation,
          layer.gradientColors
        );
      });
      
      // Reset global alpha for dust particles
      ctx.globalAlpha = 1;
      
      // Draw dust particles with subtle glow
      dustParticlesRef.current.forEach(particle => {
        updateDustParticle(particle, mouseX, mouseY, canvas, timestamp);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace(/[\d.]+\)$/, `${particle.alpha})`);
        ctx.fill();
        
        // Add subtle glow to particles
        drawGlow(
          ctx, 
          particle.x, 
          particle.y, 
          particle.size * 6, 
          particle.color.replace(/[\d.]+\)$/, `${particle.alpha * 0.2})`)
        );
      });
      
      // Gentle mouse glow effect when moving
      if (mouseX !== 0 && mouseY !== 0) {
        drawGlow(ctx, mouseX, mouseY, 150, 'rgba(230, 230, 255, 0.02)');
      }

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
    requestIdRef.current = requestAnimationFrame(animate);

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
