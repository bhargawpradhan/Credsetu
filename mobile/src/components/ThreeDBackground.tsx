import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { THEME } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ThreeDBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 3D Point class for floating crystal nodes in perspective space
    interface Point3D {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      size: number;
      color: string;
    }

    const points: Point3D[] = [];
    const numPoints = 45;
    const colors = [
      'rgba(245, 158, 11, 0.7)', // Marigold
      'rgba(251, 191, 36, 0.8)', // Bright Marigold
      'rgba(226, 232, 240, 0.85)', // Ice Silver
      'rgba(248, 250, 252, 0.9)', // Frost Silver
      'rgba(192, 132, 252, 0.6)', // Aubergine Violet
    ];

    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: (Math.random() - 0.5) * 1200,
        y: (Math.random() - 0.5) * 1200,
        z: Math.random() * 800 + 100,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - width / 2) / (width / 2);
      mouseY = (e.clientY - height / 2) / (height / 2);
      targetRotY = mouseX * 0.35;
      targetRotX = -mouseY * 0.35;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const focalLength = 400;

    const render = () => {
      // Smooth interpolation for 3D camera rotation
      currentRotX += (targetRotX - currentRotX) * 0.05;
      currentRotY += (targetRotY - currentRotY) * 0.05;

      // Deep Aubergine cosmic gradient clear
      const gradient = ctx.createRadialGradient(
        width / 2 + mouseX * 100,
        height / 2 + mouseY * 100,
        50,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      gradient.addColorStop(0, '#230B34'); // Aubergine nebula glow
      gradient.addColorStop(0.45, '#13061C'); // Deep Aubergine velvet
      gradient.addColorStop(1, '#09020E'); // Absolute cosmic darkness
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Floating Ambient 3D Light Orbs (Marigold & Ice Silver)
      // Marigold Orb (Top Right)
      const marigoldGlow = ctx.createRadialGradient(
        width * 0.8 + Math.sin(Date.now() * 0.001) * 40,
        height * 0.2 + Math.cos(Date.now() * 0.0012) * 30,
        10,
        width * 0.8,
        height * 0.2,
        280
      );
      marigoldGlow.addColorStop(0, 'rgba(245, 158, 11, 0.18)');
      marigoldGlow.addColorStop(0.5, 'rgba(217, 119, 6, 0.08)');
      marigoldGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = marigoldGlow;
      ctx.beginPath();
      ctx.arc(width * 0.8, height * 0.2, 280, 0, Math.PI * 2);
      ctx.fill();

      // Ice Silver Orb (Bottom Left)
      const iceGlow = ctx.createRadialGradient(
        width * 0.2 + Math.cos(Date.now() * 0.0009) * 30,
        height * 0.8 + Math.sin(Date.now() * 0.0011) * 30,
        10,
        width * 0.2,
        height * 0.8,
        320
      );
      iceGlow.addColorStop(0, 'rgba(226, 232, 240, 0.12)');
      iceGlow.addColorStop(0.6, 'rgba(148, 163, 184, 0.05)');
      iceGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = iceGlow;
      ctx.beginPath();
      ctx.arc(width * 0.2, height * 0.8, 320, 0, Math.PI * 2);
      ctx.fill();

      // Project & render 3D Nodes
      const projected: { x: number; y: number; scale: number; p: Point3D }[] = [];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Wrap around boundaries
        if (p.x < -600) p.x = 600;
        if (p.x > 600) p.x = -600;
        if (p.y < -600) p.y = 600;
        if (p.y > 600) p.y = -600;
        if (p.z < 50) p.z = 800;
        if (p.z > 800) p.z = 50;

        // 3D Rotation transform around Y and X axis
        const cosY = Math.cos(currentRotY);
        const sinY = Math.sin(currentRotY);
        const cosX = Math.cos(currentRotX);
        const sinX = Math.sin(currentRotX);

        // Rotate Y
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;

        // Rotate X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX + 450;

        if (z2 <= 0) continue;

        const scale = focalLength / z2;
        const px = width / 2 + x1 * scale;
        const py = height / 2 + y2 * scale;

        projected.push({ x: px, y: py, scale, p });

        // Draw node
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.5, p.size * scale), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8 * scale;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw 3D connecting filaments between close nodes
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.22 * Math.min(p1.scale, p2.scale);
            ctx.strokeStyle = `rgba(226, 232, 240, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <canvas
          ref={canvasRef as any}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Ambient background glow layers for native platforms */}
      <View style={styles.ambientOrbMarigold} />
      <View style={styles.ambientOrbSilver} />
      <View style={styles.ambientOrbAubergine} />

      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.aubergine.darkest,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  ambientOrbMarigold: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    opacity: 0.8,
  },
  ambientOrbSilver: {
    position: 'absolute',
    bottom: 40,
    left: -100,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(226, 232, 240, 0.08)',
    opacity: 0.8,
  },
  ambientOrbAubergine: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(61, 21, 87, 0.25)',
    opacity: 0.6,
  },
});
