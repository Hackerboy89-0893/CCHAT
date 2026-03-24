import { useEffect, useState } from "react";

interface PageTransitionProps {
  isActive: boolean;
  onComplete?: () => void;
}

export function PageTransition({ isActive, onComplete }: PageTransitionProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (isActive) {
      // Generate random steam particles
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 50,
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);

      // Scroll to top with smooth animation
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Complete animation after 1.2 seconds
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Main overlay with gradient fade */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-blue-500/30 via-blue-400/20 to-transparent"
        style={{
          animation: "fadeOut 1.2s ease-out forwards",
        }}
      />

      {/* Steam particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-white/40 blur-xl"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${40 + Math.random() * 60}px`,
            height: `${40 + Math.random() * 60}px`,
            animation: `steamRise 1.2s ease-out forwards`,
            animationDelay: `${particle.delay}s`,
            filter: "blur(20px)",
          }}
        />
      ))}

      {/* Swirl effect lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: 0.6,
          animation: "fadeOut 1.2s ease-out forwards",
        }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Animated swirl paths */}
        <path
          d="M 0 0 Q 100 50 200 0 T 400 0"
          stroke="rgba(59, 130, 246, 0.5)"
          strokeWidth="2"
          fill="none"
          filter="url(#glow)"
          style={{
            animation: "swirlMove 1.2s ease-out forwards",
          }}
        />
        <path
          d="M 0 20 Q 120 60 240 20 T 480 20"
          stroke="rgba(147, 197, 253, 0.4)"
          strokeWidth="2"
          fill="none"
          filter="url(#glow)"
          style={{
            animation: "swirlMove 1.2s ease-out forwards 0.1s",
          }}
        />
      </svg>

      {/* Center glow burst */}
      <div
        className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "200px",
          height: "200px",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(40px)",
          animation: "burstExpand 1.2s ease-out forwards",
        }}
      />

      {/* Loading text that fades */}
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
        style={{
          animation: "fadeOut 0.8s ease-out forwards 0.4s",
          animationFillMode: "both",
        }}
      >
        <div className="text-white font-bold text-lg tracking-widest drop-shadow-lg">
          LOADING
        </div>
        <div className="flex justify-center gap-1 mt-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-white rounded-full"
              style={{
                animation: `pulse 1s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeOut {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes steamRise {
          0% {
            opacity: 0.8;
            transform: translateY(0) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(1.5);
          }
        }

        @keyframes swirlMove {
          0% {
            stroke-dashoffset: 500;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }

        @keyframes burstExpand {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
