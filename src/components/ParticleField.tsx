"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type ParticleFieldProps = {
  className?: string;
};

/**
 * Ambient Three.js particle field for the hero section (Section 60 of the master brief).
 *
 * - Client-only (see ParticleFieldCanvas for the ssr:false dynamic import).
 * - Respects prefers-reduced-motion: renders a single static frame instead of animating.
 * - Scales particle count down on narrow viewports for mobile performance.
 * - Subtle pointer parallax; fully cleans up WebGL resources on unmount.
 */
export default function ParticleField({ className }: ParticleFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 500 : 1500;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    container.appendChild(renderer.domElement);

    // Particle geometry: random points inside a wide, flat box in front of the camera.
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // z
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xfacc15, // chaos-gold
      size: isMobile ? 0.035 : 0.045,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let pointerX = 0;
    let pointerY = 0;
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    if (!prefersReducedMotion) {
      window.addEventListener("pointermove", handlePointerMove);
    }

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    let frameId = 0;
    const clock = new THREE.Clock();

    const renderFrame = () => {
      const elapsed = clock.getElapsedTime();
      points.rotation.y = elapsed * 0.03;
      points.rotation.x = Math.sin(elapsed * 0.05) * 0.05;

      // Subtle pointer parallax, eased toward the target.
      camera.position.x += (pointerX * 0.6 - camera.position.x) * 0.02;
      camera.position.y += (-pointerY * 0.4 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    if (prefersReducedMotion) {
      // Render a single static frame and skip the animation loop entirely.
      renderFrame();
    } else {
      const animate = () => {
        renderFrame();
        frameId = requestAnimationFrame(animate);
      };
      animate();
    }

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
