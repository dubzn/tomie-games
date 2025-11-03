import { useState, useEffect, createContext, useContext, useRef } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

// Contexto de Audio
interface AudioContextType {
  isMusicEnabled: boolean;
  isSoundEnabled: boolean;
  toggleMusic: () => void;
  toggleSound: () => void;
  playEffect: () => void;
  restartMusic: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Hook para usar el contexto de audio
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio debe ser usado dentro de AudioProvider');
  }
  return context;
};

// Provider de Audio
export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const effectSoundRef = useRef<HTMLAudioElement | null>(null);
  const location = useLocation();
  const previousPathRef = useRef<string>('');
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);

  // Función para inicializar el audio después de la primera interacción
  const initializeAudio = async () => {
    if (isAudioInitialized) return;

    try {
      // Crear elementos de audio si no existen
      if (!backgroundMusicRef.current) {
        backgroundMusicRef.current = new Audio('/music/bg.mp3');
        backgroundMusicRef.current.loop = true;
        backgroundMusicRef.current.volume = 0;
        backgroundMusicRef.current.preload = 'auto';
      }

      // Intentar reproducir la música si está habilitada
      if (isMusicEnabled && backgroundMusicRef.current && !hasStartedRef.current) {
        try {
          await backgroundMusicRef.current.play();
          hasStartedRef.current = true;
          console.log('🎵 Música de fondo iniciada correctamente');
          
          // Fade in durante 2 segundos
          const fadeInterval = setInterval(() => {
            if (backgroundMusicRef.current && backgroundMusicRef.current.volume < 0.4) {
              backgroundMusicRef.current.volume = Math.min(backgroundMusicRef.current.volume + 0.02, 0.4);
            } else {
              clearInterval(fadeInterval);
            }
          }, 50);
        } catch (err) {
          console.log('⚠️ Error al reproducir música:', err);
        }
      }

      setIsAudioInitialized(true);
    } catch (error) {
      console.log('⚠️ Error al inicializar audio:', error);
    }
  };

  // Inicializar el audio cuando se monta el componente
  useEffect(() => {
    // Agregar listeners para detectar la primera interacción del usuario
    const handleFirstInteraction = () => {
      initializeAudio();
      // Remover los listeners después de la primera interacción
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    // Cleanup al desmontar
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
      }
      if (effectSoundRef.current) {
        effectSoundRef.current = null;
      }
    };
  }, []);

  // Controlar la música de fondo cuando cambia el estado
  useEffect(() => {
    if (backgroundMusicRef.current && isAudioInitialized) {
      if (isMusicEnabled) {
        if (!hasStartedRef.current) {
          backgroundMusicRef.current.play().catch(err => {
            console.log('Error reproduciendo música:', err);
          });
          hasStartedRef.current = true;
          
          // Fade in
          const fadeInterval = setInterval(() => {
            if (backgroundMusicRef.current && backgroundMusicRef.current.volume < 0.4) {
              backgroundMusicRef.current.volume = Math.min(backgroundMusicRef.current.volume + 0.02, 0.4);
            } else {
              clearInterval(fadeInterval);
            }
          }, 50);
        }
      } else {
        backgroundMusicRef.current.pause();
      }
    }
  }, [isMusicEnabled, isAudioInitialized]);

  // Detectar cambios de ruta y hacer pequeño fade durante transiciones
  useEffect(() => {
    if (!backgroundMusicRef.current || !hasStartedRef.current || !isAudioInitialized) return;
    
    // Ignorar si es la primera carga
    if (previousPathRef.current === '') {
      previousPathRef.current = location.pathname;
      return;
    }

    // Solo hacer fade si realmente cambió la ruta
    if (previousPathRef.current === location.pathname) {
      return;
    }

    previousPathRef.current = location.pathname;

    // Limpiar timeout anterior si existe
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }

    // Fade out ligero (hasta 0.25) durante la transición
    const fadeOut = () => {
      if (backgroundMusicRef.current) {
        const targetVolume = 0.25;
        const fadeInterval = setInterval(() => {
          if (backgroundMusicRef.current && backgroundMusicRef.current.volume > targetVolume) {
            backgroundMusicRef.current.volume = Math.max(backgroundMusicRef.current.volume - 0.05, targetVolume);
          } else {
            clearInterval(fadeInterval);
          }
        }, 30);
      }
    };

    // Fade in de vuelta después de la transición
    const fadeIn = () => {
      if (backgroundMusicRef.current) {
        const targetVolume = 0.4;
        const fadeInterval = setInterval(() => {
          if (backgroundMusicRef.current && backgroundMusicRef.current.volume < targetVolume) {
            backgroundMusicRef.current.volume = Math.min(backgroundMusicRef.current.volume + 0.03, targetVolume);
          } else {
            clearInterval(fadeInterval);
          }
        }, 30);
      }
    };

    // Empezar fade out inmediatamente
    fadeOut();

    // Fade in después de 1 segundo (mitad de la transición de 2 segundos)
    fadeTimeoutRef.current = setTimeout(() => {
      fadeIn();
    }, 1000);

    // Cleanup
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [location.pathname, isAudioInitialized]);

  const toggleMusic = () => {
    setIsMusicEnabled(prev => !prev);
  };

  const toggleSound = () => {
    setIsSoundEnabled(prev => !prev);
  };

  const playEffect = () => {
    if (isSoundEnabled && effectSoundRef.current) {
      effectSoundRef.current.currentTime = 0; // Reiniciar el sonido
      effectSoundRef.current.play().catch(err => {
        console.log('Error reproduciendo efecto:', err);
      });
    }
  };

  const restartMusic = () => {
    if (backgroundMusicRef.current && isAudioInitialized && isMusicEnabled) {
      backgroundMusicRef.current.currentTime = 0; // Reiniciar desde el principio
      
      // Reproducir si está pausado
      if (backgroundMusicRef.current.paused) {
        backgroundMusicRef.current.play().catch(err => {
          console.log('Error reiniciando música:', err);
        });
      }
      
      // Fade in durante 2 segundos
      backgroundMusicRef.current.volume = 0;
      const fadeInterval = setInterval(() => {
        if (backgroundMusicRef.current && backgroundMusicRef.current.volume < 0.4) {
          backgroundMusicRef.current.volume = Math.min(backgroundMusicRef.current.volume + 0.02, 0.4);
        } else {
          clearInterval(fadeInterval);
        }
      }, 50);
    }
  };

  return (
    <AudioContext.Provider value={{
      isMusicEnabled,
      isSoundEnabled,
      toggleMusic,
      toggleSound,
      playEffect,
      restartMusic
    }}>
      {children}
    </AudioContext.Provider>
  );
};

