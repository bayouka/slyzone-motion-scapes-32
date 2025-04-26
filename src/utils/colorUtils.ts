
export const getRandomBlueColor = (isHexagon = false): string => {
  const blueShades = isHexagon 
    ? ['rgba(0, 210, 255, 0.2)', 'rgba(0, 180, 255, 0.2)', 'rgba(0, 150, 255, 0.2)'] 
    : ['rgba(0, 210, 255, 0.8)', 'rgba(0, 180, 255, 0.8)', 'rgba(0, 150, 255, 0.8)', 'rgba(0, 230, 255, 0.8)'];
  return blueShades[Math.floor(Math.random() * blueShades.length)];
};

