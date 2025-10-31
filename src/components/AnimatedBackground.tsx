import { motion } from 'motion/react';

interface AnimatedBackgroundProps {
  variant: 'customer' | 'retailer' | 'portal-select';
  children: React.ReactNode;
}

export function AnimatedBackground({ variant, children }: AnimatedBackgroundProps) {
  const getColors = () => {
    switch (variant) {
      case 'customer':
        return {
          bg: 'bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50',
          primary: 'rgba(255, 192, 203, 0.15)', // pale pink
          secondary: 'rgba(255, 228, 196, 0.12)', // bisque
          tertiary: 'rgba(255, 250, 240, 0.1)', // floral white
          accent: 'rgba(255, 215, 0, 0.08)', // gold
        };
      case 'retailer':
        return {
          bg: 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50',
          primary: 'rgba(255, 140, 0, 0.1)', // dark orange
          secondary: 'rgba(255, 165, 0, 0.08)', // orange
          tertiary: 'rgba(255, 193, 7, 0.06)', // amber
          accent: 'rgba(255, 87, 34, 0.08)', // deep orange
        };
      case 'portal-select':
        return {
          bg: 'bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100',
          primary: 'rgba(255, 105, 180, 0.2)', // hot pink
          secondary: 'rgba(255, 140, 0, 0.15)', // dark orange
          tertiary: 'rgba(186, 85, 211, 0.12)', // medium orchid
          accent: 'rgba(255, 215, 0, 0.12)', // gold
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50',
          primary: 'rgba(255, 192, 203, 0.15)',
          secondary: 'rgba(255, 228, 196, 0.12)',
          tertiary: 'rgba(255, 250, 240, 0.1)',
          accent: 'rgba(255, 215, 0, 0.08)',
        };
    }
  };

  const colors = getColors();

  return (
    <div className="relative min-h-screen">
      {/* Static base gradient - very light */}
      <div className={`fixed inset-0 ${colors.bg} pointer-events-none`} />

      {/* Animated flowing fabric layers - very subtle */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* First silk wave */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 30% 50%, ${colors.primary}, transparent)`,
          }}
          animate={{
            x: ['-10%', '10%', '-10%'],
            y: ['0%', '5%', '0%'],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Second silk wave */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 70% 60%, ${colors.secondary}, transparent)`,
          }}
          animate={{
            x: ['10%', '-10%', '10%'],
            y: ['0%', '-5%', '0%'],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Third silk wave - ivory/cream */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 70% at 50% 40%, ${colors.tertiary}, transparent)`,
          }}
          animate={{
            x: ['0%', '8%', '0%'],
            y: ['0%', '8%', '0%'],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 32,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Gentle shimmer sweep - very subtle */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: `linear-gradient(120deg, transparent 30%, ${colors.accent} 50%, transparent 70%)`,
          }}
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Floating bokeh particles - very light */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`bokeh-${i}`}
            className="absolute rounded-full opacity-40"
            style={{
              width: `${Math.random() * 6 + 3}px`,
              height: `${Math.random() * 6 + 3}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, ${i % 3 === 0 ? colors.accent : i % 3 === 1 ? colors.primary : colors.secondary}, transparent)`,
              filter: 'blur(1px)',
            }}
            animate={{
              y: [0, -80 - Math.random() * 60, -150 - Math.random() * 80],
              x: [0, (Math.random() - 0.5) * 40],
              opacity: [0, 0.4, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 12 + Math.random() * 8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 1.2,
            }}
          />
        ))}

        {/* Sparkle stars - minimal */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute"
            style={{
              left: `${(i * 12) % 100}%`,
              top: `${(i * 17) % 100}%`,
            }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0, 1.2, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.8,
            }}
          >
            <div
              className="w-1.5 h-1.5 opacity-50"
              style={{
                background: colors.accent,
                boxShadow: `0 0 6px ${colors.accent}`,
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              }}
            />
          </motion.div>
        ))}

        {/* Soft rotating light */}
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, 
              transparent 0deg, 
              ${colors.accent} 60deg, 
              transparent 120deg, 
              ${colors.primary} 180deg, 
              transparent 240deg, 
              ${colors.secondary} 300deg, 
              transparent 360deg)`,
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 120,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Content layer - fully interactive and visible */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
