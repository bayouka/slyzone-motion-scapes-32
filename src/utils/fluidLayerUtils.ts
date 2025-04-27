
export interface FluidLayer {
  x: number;
  y: number;
  size: number;
  alpha: number;
  color: string;
  speed: number;
  rotation: number;
  amplitude: number;
  phase: number;
  gradientColors: string[];
}

export const createFluidLayer = (width: number, height: number): FluidLayer => {
  const pastelColors = [
    'rgba(230, 218, 255, 0.15)', // pale lavender
    'rgba(255, 217, 230, 0.15)', // dusty rose
    'rgba(217, 242, 230, 0.15)', // mint green
    'rgba(217, 242, 255, 0.15)', // ice blue
    'rgba(242, 230, 255, 0.15)', // light purple
  ];
  
  const baseColor = pastelColors[Math.floor(Math.random() * pastelColors.length)];
  const secondColor = pastelColors[Math.floor(Math.random() * pastelColors.length)];
  
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 300 + 200, // Much larger, soft shapes
    alpha: Math.random() * 0.1 + 0.05, // Very subtle opacity
    color: baseColor,
    speed: Math.random() * 0.1 + 0.05, // Very slow movement
    rotation: Math.random() * Math.PI * 2,
    amplitude: Math.random() * 2 + 1,
    phase: Math.random() * Math.PI * 2,
    gradientColors: [baseColor, secondColor],
  };
};

export const createFluidLayers = (width: number, height: number): FluidLayer[] => {
  const layers: FluidLayer[] = [];
  const layerCount = 5; // Fewer, larger layers
  
  for (let i = 0; i < layerCount; i++) {
    layers.push(createFluidLayer(width, height));
  }
  
  return layers;
};

export const updateFluidLayer = (layer: FluidLayer, mouseX: number, mouseY: number, canvas: HTMLCanvasElement, time: number) => {
  // Very slow rotation
  layer.rotation += layer.speed * 0.01;
  
  // Gentle undulating movement using sine waves
  const originalX = layer.x;
  const originalY = layer.y;
  
  // Subtle parallax effect on mouse movement
  const parallaxFactor = 0.01;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Calculate mouse offset from center
  const mouseOffsetX = (mouseX - centerX) * parallaxFactor;
  const mouseOffsetY = (mouseY - centerY) * parallaxFactor;
  
  // Add sine wave movement
  layer.x = originalX + Math.sin(time * 0.0005 + layer.phase) * layer.amplitude * 10;
  layer.y = originalY + Math.cos(time * 0.0003 + layer.phase) * layer.amplitude * 8;
  
  // Add parallax effect
  layer.x -= mouseOffsetX * (layer.size / 300); // Larger shapes move less
  layer.y -= mouseOffsetY * (layer.size / 300);
  
  // Gentle pulsing in size and alpha
  const sizePulse = Math.sin(time * 0.0002 + layer.phase) * 10;
  layer.size = Math.max(200, layer.size + sizePulse);
  
  const alphaPulse = Math.sin(time * 0.0003 + layer.phase) * 0.01;
  layer.alpha = Math.max(0.05, Math.min(0.2, layer.alpha + alphaPulse));
  
  // Wrap around edges very gently
  if (layer.x < -layer.size) layer.x = canvas.width + layer.size;
  if (layer.x > canvas.width + layer.size) layer.x = -layer.size;
  if (layer.y < -layer.size) layer.y = canvas.height + layer.size;
  if (layer.y > canvas.height + layer.size) layer.y = -layer.size;
};
