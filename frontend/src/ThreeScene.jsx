import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeScene() {
  const sceneRef = useRef(null);

  useEffect(() => {
    const container = sceneRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    // Keep scene background transparent to show glassmorphic card gradient underneath

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 75); // Look from a slight distance for subtle ortho-like perspective

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // DUAL LAYER MESH
    const innerGeom = new THREE.IcosahedronGeometry(22, 2);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xc7d2fe,
      transparent: true,
      opacity: 0.15,
      roughness: 0.4,
      metalness: 0.8,
      emissive: 0x6366f1,
      emissiveIntensity: 0.6,
    });
    const innerMesh = new THREE.Mesh(innerGeom, innerMat);
    scene.add(innerMesh);

    const outerGeom = new THREE.IcosahedronGeometry(23.5, 2);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.45,
    });
    const outerMesh = new THREE.Mesh(outerGeom, outerMat);
    scene.add(outerMesh);

    const light = new THREE.PointLight(0x8b5cf6, 2.5);
    light.position.set(40, 40, 40);
    scene.add(light);

    const secondaryLight = new THREE.PointLight(0x3b82f6, 1.8);
    secondaryLight.position.set(-40, -40, 20);
    scene.add(secondaryLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambient);

    // STARFIELD PARTICLES
    const stars = new THREE.BufferGeometry();
    const starCount = 1400;
    const starVertices = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starVertices[i] = (Math.random() - 0.5) * 160;
      starVertices[i + 1] = (Math.random() - 0.5) * 160;
      starVertices[i + 2] = (Math.random() - 0.5) * 120;
    }

    stars.setAttribute("position", new THREE.BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0x8b5cf6,
      size: 0.35,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(stars, starMaterial);
    scene.add(starField);

    // MOUSE PARALLAX TRACKING
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const handleMouseMove = (event) => {
      // Normalize to -1 to 1
      target.x = (event.clientX / window.innerWidth) * 2 - 1;
      target.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let frameId;
    let baseRotationX = 0;
    let baseRotationY = 0;
    let time = 0;

    const animate = () => {
      time += 0.005;
      baseRotationY += 0.003;
      baseRotationX += 0.0015;

      // Lerp mouse coordinates for smooth lag-parallax
      mouse.x += (target.x - mouse.x) * 0.045;
      mouse.y += (target.y - mouse.y) * 0.045;

      // Animate mesh rotation combining auto-spin + mouse tracking
      innerMesh.rotation.y = baseRotationY + mouse.x * 0.45;
      innerMesh.rotation.x = baseRotationX + mouse.y * 0.3;

      outerMesh.rotation.y = -baseRotationY * 1.5 - mouse.x * 0.25;
      outerMesh.rotation.x = -baseRotationX * 1.5 - mouse.y * 0.2;

      // Slowly float the mesh up and down
      const floatOffset = Math.sin(time) * 1.5;
      innerMesh.position.y = floatOffset;
      outerMesh.position.y = floatOffset;

      // Rotate starfield
      starField.rotation.y = baseRotationY * 0.12 + mouse.x * 0.08;
      starField.rotation.x = mouse.y * 0.05;

      // Pulsate starfield opacity
      starMaterial.opacity = 0.35 + Math.sin(time * 2.5) * 0.15;

      // Camera parallax
      camera.position.x = mouse.x * 8;
      camera.position.y = mouse.y * 8;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
      innerGeom.dispose();
      innerMat.dispose();
      outerGeom.dispose();
      outerMat.dispose();
      starMaterial.dispose();
    };
  }, []);

  return <div ref={sceneRef} className="three-scene" />;
}
