
import { getRandomBlueColor } from './colorUtils';

export interface Hexagon {
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  alpha: number;
  color: string;
}

export const createHexagon = (width: number, height: number): Hexagon => ({
  x: Math.random() * width,
  y: Math.random() * height,
  size: Math.random() * 50 + 20,
  rotation: Math.random() * Math.PI * 2,
  speed: Math.random() * 0.002 + 0.001,
  alpha: Math.random() * 0.3 + 0.1,
  color: getRandomBlueColor(true),
});

export const createHexagons = (width: number, height: number): Hexagon[] => {
  const hexagons: Hexagon[] = [];
  const hexagonCount = Math.floor(width / 100);
  
  for (let i = 0; i < hexagonCount; i++) {
    hexagons.push(createHexagon(width, height));
  }
  
  return hexagons;
};

export const updateHexagon = (hexagon: Hexagon, mouseX: number, mouseY: number, canvas: HTMLCanvasElement) => {
  hexagon.rotation += hexagon.speed;

  const dx = mouseX - hexagon.x;
  const dy = mouseY - hexagon.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const maxDistance = 300;
  if (distance < maxDistance) {
    hexagon.alpha = Math.min(0.3, hexagon.alpha + 0.01);
    const angle = Math.atan2(dy, dx);
    hexagon.x += Math.cos(angle) * 0.5;
    hexagon.y += Math.sin(angle) * 0.5;
  } else {
    hexagon.alpha = Math.max(0.1, hexagon.alpha - 0.005);
  }

  if (hexagon.x < -hexagon.size) hexagon.x = canvas.width + hexagon.size;
  if (hexagon.x > canvas.width + hexagon.size) hexagon.x = -hexagon.size;
  if (hexagon.y < -hexagon.size) hexagon.y = canvas.height + hexagon.size;
  if (hexagon.y > canvas.height + hexagon.size) hexagon.y = -hexagon.size;
};

