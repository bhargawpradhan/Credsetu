import React, { useState, useRef } from 'react';
import { View, StyleSheet, Platform, Animated, ViewStyle } from 'react-native';
import { THEME } from '../theme/colors';

interface ThreeDTiltCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  isOverdue?: boolean;
  isRepaid?: boolean;
  glowColor?: string;
  maxTilt?: number;
}

export const ThreeDTiltCard: React.FC<ThreeDTiltCardProps> = ({
  children,
  style,
  isOverdue = false,
  isRepaid = false,
  glowColor,
  maxTilt = 12,
}) => {
  const cardRef = useRef<View>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  // Web 3D Tilt handlers
  const handleMouseMove = (e: any) => {
    if (Platform.OS !== 'web') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * maxTilt;
    const rotY = ((x - centerX) / centerX) * maxTilt;

    setTilt({ x: rotX, y: rotY, active: true });
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.65,
    });
  };

  const handleMouseEnter = () => {
    setTilt((prev) => ({ ...prev, active: true }));
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, active: false });
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  // Border & Glow styling based on status
  let borderColor = THEME.iceSilver.border;
  let shadowGlow = THEME.iceSilver.glow;

  if (isOverdue) {
    borderColor = 'rgba(239, 68, 68, 0.7)';
    shadowGlow = 'rgba(239, 68, 68, 0.45)';
  } else if (isRepaid) {
    borderColor = 'rgba(16, 185, 129, 0.45)';
    shadowGlow = 'rgba(16, 185, 129, 0.25)';
  } else if (glowColor) {
    shadowGlow = glowColor;
  }

  // Web-specific 3D transform object
  const web3DTransformStyle = Platform.OS === 'web' ? {
    transform: tilt.active
      ? `perspective(1000px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
      : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: tilt.active
      ? 'transform 0.1s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease'
      : 'transform 0.5s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.5s ease',
    boxShadow: tilt.active
      ? `0 24px 48px -12px rgba(0, 0, 0, 0.7), 0 0 35px ${shadowGlow}`
      : `0 12px 30px -8px rgba(0, 0, 0, 0.5), 0 0 15px ${shadowGlow}`,
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
  } : {};

  return (
    <View
      ref={cardRef}
      style={[
        styles.cardContainer,
        {
          borderColor,
        },
        isOverdue && styles.overdueActive,
        web3DTransformStyle as any,
        style,
      ]}
      // Web hover listeners
      {...({
        onMouseMove: handleMouseMove,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      } as any)}
    >
      {/* 3D Specular Light Glare Layer (Web) */}
      {Platform.OS === 'web' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            borderRadius: 'inherit',
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, ${glarePos.opacity * 0.35}) 0%, rgba(245, 158, 11, ${glarePos.opacity * 0.15}) 40%, rgba(0, 0, 0, 0) 80%)`,
            transition: 'opacity 0.2s ease',
            zIndex: 10,
          }}
        />
      )}

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: THEME.aubergine.glass,
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  overdueActive: {
    backgroundColor: 'rgba(45, 12, 28, 0.55)',
  },
});
