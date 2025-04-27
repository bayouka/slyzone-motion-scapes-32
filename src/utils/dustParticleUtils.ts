
export interface DustParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
  color: string;
  initialAlpha: number;
}

export const getRandomPastelColor = (): string => {
  const pastelColors = [
    'rgba(230, 218, 255, 0.6)', // pale lavender
    'rgba(255, 217, 230, 0.6)', // dusty rose
    'rgba(217, 242, 230, 0.6)', // mint green
    'rgba(217, 242, 255, 0.6)', // ice blue
    'rgba(242, 230, 255, 0.6)', // light purple
  ];
  return pastelColors[Math.floor(Math.random() * pastelColors.length)];
};

export const createDustParticle = (width: number, height: number): DustParticle => {
  const alpha = Math.random() * 0.3 + 0.1; // Particules très subtiles
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 1.5 + 0.5, // Particules de poussière très petites
    speed: Math.random() * 0.2 + 0.1, // Mouvement très lent
    alpha,
    initialAlpha: alpha,
    color: getRandomPastelColor(),
  };
};

export const createDustParticles = (width: number, height: number): DustParticle[] => {
  const particles: DustParticle[] = [];
  const particleCount = Math.floor(width / 30); // Moins de particules, plus espacées
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(createDustParticle(width, height));
  }
  
  return particles;
};

export const updateDustParticle = (particle: DustParticle, mouseX: number, mouseY: number, canvas: HTMLCanvasElement, time: number) => {
  // Dérive douce vers le haut
  particle.y -= particle.speed;
  
  // Mouvement latéral subtil utilisant une onde sinusoïdale
  particle.x += Math.sin(time * 0.001 + particle.y * 0.01) * 0.2;
  
  // Pulsation subtile de l'alpha pour un effet de lueur douce
  const alphaPulse = Math.sin(time * 0.002) * 0.05;
  particle.alpha = Math.max(0.05, Math.min(particle.initialAlpha, particle.alpha + alphaPulse));
  
  // Réinitialiser la particule quand elle sort de l'écran
  if (particle.y < 0) {
    particle.y = canvas.height;
    particle.x = Math.random() * canvas.width;
  }
};

