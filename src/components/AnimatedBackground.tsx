import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  alpha: number;
}

interface Hexagon {
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  alpha: number;
  color: string;
}

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
      createParticles();
      createHexagons();
    };

    const createParticles = () => {
      const particles: Particle[] = [];
      const particleCount = Math.floor(window.innerWidth / 15);
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 8 + 2,
          speedX: Math.random() * 1 - 0.5,
          speedY: Math.random() * 1 - 0.5,
          color: getRandomBlueColor(),
          alpha: Math.random() * 0.7 + 0.3,
        });
      }
      
      particlesRef.current = particles;
    };

    const createHexagons = () => {
      const hexagons: Hexagon[] = [];
      const hexagonCount = Math.floor(window.innerWidth / 100);
      
      for (let i = 0; i < hexagonCount; i++) {
        hexagons.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 50 + 20,
          rotation: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.002 + 0.001,
          alpha: Math.random() * 0.3 + 0.1,
          color: getRandomBlueColor(true),
        });
      }
      
      hexagonsRef.current = hexagons;
    };

    const getRandomBlueColor = (isHexagon = false) => {
      const blueShades = isHexagon 
        ? ['rgba(0, 210, 255, 0.2)', 'rgba(0, 180, 255, 0.2)', 'rgba(0, 150, 255, 0.2)'] 
        : ['rgba(0, 210, 255, 0.8)', 'rgba(0, 180, 255, 0.8)', 'rgba(0, 150, 255, 0.8)', 'rgba(0, 230, 255, 0.8)'];
      return blueShades[Math.floor(Math.random() * blueShades.length)];
    };

    const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, color: string) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const drawGlow = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawBackground = () => {
      // Create a gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'hsl(194, 100%, 5%)');  // Very dark blue
      gradient.addColorStop(0.5, 'hsl(189, 100%, 10%)'); // Dark blue
      gradient.addColorStop(1, 'hsl(194, 100%, 15%)');   // Medium-dark blue
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add some dark areas and texture
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const animate = () => {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBackground();

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;

      // Draw large glow at mouse position
      if (mouseX !== 0 && mouseY !== 0) {
        drawGlow(ctx, mouseX, mouseY, 200, 'rgba(0, 210, 255, 0.03)');
      }

      // Update and draw hexagons
      hexagonsRef.current.forEach(hexagon => {
        // Slowly rotate hexagons
        hexagon.rotation += hexagon.speed;

        // Calculate distance from mouse
        const dx = mouseX - hexagon.x;
        const dy = mouseY - hexagon.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If mouse is close, increase alpha
        const maxDistance = 300;
        if (distance < maxDistance) {
          hexagon.alpha = Math.min(0.3, hexagon.alpha + 0.01);
        } else {
          hexagon.alpha = Math.max(0.1, hexagon.alpha - 0.005);
        }

        // Move hexagons slightly based on mouse position
        if (distance < maxDistance) {
          const angle = Math.atan2(dy, dx);
          hexagon.x += Math.cos(angle) * 0.5;
          hexagon.y += Math.sin(angle) * 0.5;
        }

        // Keep hexagons within canvas
        if (hexagon.x < -hexagon.size) hexagon.x = canvas.width + hexagon.size;
        if (hexagon.x > canvas.width + hexagon.size) hexagon.x = -hexagon.size;
        if (hexagon.y < -hexagon.size) hexagon.y = canvas.height + hexagon.size;
        if (hexagon.y > canvas.height + hexagon.size) hexagon.y = -hexagon.size;

        drawHexagon(
          ctx, 
          hexagon.x, 
          hexagon.y, 
          hexagon.size, 
          hexagon.rotation, 
          hexagon.color.replace(/[\d.]+\)$/, `${hexagon.alpha})`)
        );
      });

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        // Move particles
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Calculate distance from mouse
        const dx = mouseX - particle.x;
        const dy = mouseY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If mouse is close, move particles away slightly
        const maxDistance = 150;
        if (distance < maxDistance) {
          const angle = Math.atan2(dy, dx);
          particle.x -= Math.cos(angle) * (1 - distance / maxDistance) * 2;
          particle.y -= Math.sin(angle) * (1 - distance / maxDistance) * 2;
          particle.alpha = Math.min(1, particle.alpha + 0.03);
        } else {
          particle.alpha = Math.max(0.3, particle.alpha - 0.01);
        }

        // Keep particles within canvas
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace(/[\d.]+\)$/, `${particle.alpha})`);
        ctx.fill();

        // Add glow effect to particles
        drawGlow(ctx, particle.x, particle.y, particle.size * 2, particle.color.replace(/[\d.]+\)$/, `${particle.alpha * 0.5})`));
      });

      // Request next frame
      requestIdRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = {
        x: event.clientX,
        y: event.clientY
      };
    };

    // Initial setup
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);

    // Start animation
    animate();

    // Cleanup
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
