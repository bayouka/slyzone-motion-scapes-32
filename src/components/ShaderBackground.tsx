
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Shaders
const vertexShader = `
uniform float time;
uniform vec2 mousePos;
uniform float scrollPos;
varying vec2 vUv;
varying float vElevation;

void main() {
  vUv = uv;
  
  // Calculate wave effect with multiple frequencies
  float mouseEffect = sin(position.x * 2.0 + mousePos.x * 2.0) * sin(position.y * 2.0 + mousePos.y * 2.0) * 0.08;
  
  float wave1 = sin(position.x * 1.0 + position.y * 0.8 + time * 0.7) * 0.15;
  float wave2 = sin(position.x * 2.0 + position.y * 0.4 + time * 1.3) * 0.07;
  float wave3 = sin(position.x * 3.0 + position.y * 2.0 + time * 1.1) * 0.03;
  
  // Combine waves with scroll effect
  float scrollEffect = scrollPos * sin(position.x * 0.5) * 0.1;
  
  // Compute final elevation
  float elevation = wave1 + wave2 + wave3 + mouseEffect - scrollEffect;
  vElevation = elevation;
  
  // Update position
  vec3 newPosition = position;
  newPosition.z += elevation;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

const fragmentShader = `
uniform vec3 colorA;
uniform vec3 colorB;
uniform float time;
varying vec2 vUv;
varying float vElevation;

void main() {
  // Calculate dynamic glow based on elevation
  float intensity = 1.0 + vElevation * 4.0;
  
  // Add scintillation effect
  float scintillation = sin(vUv.x * 30.0 + time * 2.0) * sin(vUv.y * 30.0 + time * 2.0) * 0.05;
  intensity += scintillation;
  
  // Color gradient based on elevation and UV coordinates
  vec3 color = mix(colorB, colorA, vUv.y * 0.5 + 0.5 + vElevation);
  
  // Edge fading
  float edgeFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
  edgeFade *= smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
  
  // Apply glow, intensity and edge fading
  gl_FragColor = vec4(color * intensity, edgeFade * (0.5 + vElevation * 2.0));
}
`;

interface ShaderBackgroundProps {
  className?: string;
}

const ShaderBackground: React.FC<ShaderBackgroundProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0, y: 0, targetX: 0, targetY: 0
  });
  const scrollRef = useRef<number>(0);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 3;
    cameraRef.current = camera;
    
    // WebGL renderer with alpha
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Convert hex colors to THREE.Vector3
    const colorA = new THREE.Color("#0cc3e8");
    const colorB = new THREE.Color("#0077ff");

    // Create shader material
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        time: { value: 0 },
        mousePos: { value: new THREE.Vector2(0, 0) },
        scrollPos: { value: 0 },
        colorA: { value: new THREE.Vector3(colorA.r, colorA.g, colorA.b) },
        colorB: { value: new THREE.Vector3(colorB.r, colorB.g, colorB.b) },
      },
    });
    materialRef.current = material;
    
    // Create a high-density plane
    const geometry = new THREE.PlaneGeometry(5, 3, 120, 60);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      const camera = cameraRef.current as THREE.PerspectiveCamera;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    // Handle scroll
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = scrollHeight > 0 ? scrollY / scrollHeight : 0;
    };

    // Animation loop
    const animate = (time: number) => {
      requestIdRef.current = requestAnimationFrame(animate);
      
      if (materialRef.current) {
        // Smooth mouse movement (lerp)
        mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
        mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
        
        // Update shader uniforms
        materialRef.current.uniforms.time.value = time * 0.001;
        materialRef.current.uniforms.mousePos.value.set(mouseRef.current.x, mouseRef.current.y);
        materialRef.current.uniforms.scrollPos.value = scrollRef.current;
      }
      
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    requestIdRef.current = requestAnimationFrame(animate);

    return () => {
      // Cleanup
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      
      if (requestIdRef.current !== null) {
        cancelAnimationFrame(requestIdRef.current);
      }
      
      if (rendererRef.current && rendererRef.current.domElement) {
        containerRef.current?.removeChild(rendererRef.current.domElement);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={`full-screen ${className || ''}`} style={{ zIndex: 0 }} />
  );
};

export default ShaderBackground;
