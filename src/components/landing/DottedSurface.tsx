import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import * as THREE from "three";

type DottedSurfaceProps = Omit<React.ComponentProps<"div">, "ref">;

/**
 * Fundo ambiente de pontos em onda (Three.js), na cor da marca (dourado).
 * Adaptado pra Vite + tema fixo gold-noir, com guards de performance:
 * menos pontos no mobile, respeita prefers-reduced-motion e pausa quando
 * a aba sai de foco.
 */
export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 760;

    const SEPARATION = 160;
    const AMOUNTX = isMobile ? 22 : 42;
    const AMOUNTY = isMobile ? 34 : 64;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      10000,
    );
    camera.position.set(0, 355, 1220);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        positions.push(
          ix * SEPARATION - (AMOUNTX * SEPARATION) / 2,
          0,
          iy * SEPARATION - (AMOUNTY * SEPARATION) / 2,
        );
      }
    }
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );

    const material = new THREE.PointsMaterial({
      size: 7,
      color: 0xc9a84c, // dourado Axtor
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let count = 0;
    let animationId = 0;

    const computeWave = (animated: boolean) => {
      const pos = geometry.attributes.position.array as Float32Array;
      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const baseX = animated ? ix + count : ix;
          const baseY = animated ? iy + count : iy;
          pos[i * 3 + 1] =
            Math.sin(baseX * 0.3) * 50 + Math.sin(baseY * 0.5) * 50;
          i++;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    };

    const animate = () => {
      computeWave(true);
      renderer.render(scene, camera);
      count += 0.1;
      animationId = requestAnimationFrame(animate);
    };

    const start = () => {
      if (!animationId) animate();
    };
    const stop = () => {
      cancelAnimationFrame(animationId);
      animationId = 0;
    };

    // O movimento é o ponto central da landing — sempre anima.
    start();

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none fixed inset-0 -z-10", className)}
      {...props}
    />
  );
}
