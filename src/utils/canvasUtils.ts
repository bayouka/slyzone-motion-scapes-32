export const createGradientBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  // Créer une base douce et sombre avec un dégradé
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'hsl(220, 30%, 10%)'); // Bleu-gris foncé
  gradient.addColorStop(0.5, 'hsl(250, 25%, 12%)'); // Violet foncé atténué
  gradient.addColorStop(1, 'hsl(200, 30%, 15%)'); // Bleu-vert profond
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Ajouter un effet de vignette subtil
  const radialGradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) / 1.5
  );
  radialGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = radialGradient;
  ctx.fillRect(0, 0, width, height);
};

export const drawGlow = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) => {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
};

export const drawFluidShape = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  gradientColors: string[]
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  
  // Créer une forme fluide et amorphe avec des courbes de Bézier
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
  gradient.addColorStop(0, gradientColors[0]);
  gradient.addColorStop(1, gradientColors[1]);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  
  // Dessiner une forme fluide avec des courbes de Bézier
  // Cela crée une forme amorphe et douce
  const points = 8;
  const angleStep = (Math.PI * 2) / points;
  
  // Première point
  const startX = Math.cos(0) * size;
  const startY = Math.sin(0) * size;
  ctx.moveTo(startX, startY);
  
  // Dessiner des courbes arrondies entre les points
  for (let i = 1; i <= points; i++) {
    const angle = i * angleStep;
    const prevAngle = (i - 1) * angleStep;
    
    // Ajouter une variété de rayon pour un effet naturel
    const radiusVariation = size * 0.2;
    const radius = size + Math.sin(rotation * 2 + i) * radiusVariation;
    
    const x1 = Math.cos(prevAngle + angleStep / 3) * radius;
    const y1 = Math.sin(prevAngle + angleStep / 3) * radius;
    
    const x2 = Math.cos(angle - angleStep / 3) * radius;
    const y2 = Math.sin(angle - angleStep / 3) * radius;
    
    const x3 = Math.cos(angle) * radius;
    const y3 = Math.sin(angle) * radius;
    
    ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
  }
  
  ctx.closePath();
  ctx.fill();
  
  // Ajouter un effet de flou très doux
  ctx.shadowColor = gradientColors[0];
  ctx.shadowBlur = 30;
  ctx.fill();
  
  ctx.restore();
};
