
export interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  alpha: number;
}

export const createParticle = (width: number, height: number): Particle => ({
  x: Math.random() * width,
  y: Math.random() * height,
  size: Math.random() * 8 + 2,
  speedX: Math.random() * 1 - 0.5,
  speedY: Math.random() * 1 - 0.5,
  color: getRandomBlueColor(),
  alpha: Math.random() * 0.7 + 0.3,
});

export const createParticles = (width: number, height: number): Particle[] => {
  const particles: Particle[] = [];
  const particleCount = Math.floor(width / 15);
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(createParticle(width, height));
  }
  
  return particles;
};

export const updateParticle = (particle: Particle, mouseX: number, mouseY: number, canvas: HTMLCanvasElement) => {
  particle.x += particle.speedX;
  particle.y += particle.speedY;

  const dx = mouseX - particle.x;
  const dy = mouseY - particle.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const maxDistance = 150;
  if (distance < maxDistance) {
    const angle = Math.atan2(dy, dx);
    particle.x -= Math.cos(angle) * (1 - distance / maxDistance) * 2;
    particle.y -= Math.sin(angle) * (1 - distance / maxDistance) * 2;
    particle.alpha = Math.min(1, particle.alpha + 0.03);
  } else {
    particle.alpha = Math.max(0.3, particle.alpha - 0.01);
  }

  if (particle.x < 0) particle.x = canvas.width;
  if (particle.x > canvas.width) particle.x = 0;
  if (particle.y < 0) particle.y = canvas.height;
  if (particle.y > canvas.height) particle.y = 0;
};

