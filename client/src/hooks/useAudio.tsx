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
  playVoice: (audioPath: string) => Promise<number>; // Retorna la duración del audio en segundos
  stopVoice: () => void; // Detiene el audio de voz actual
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
  const currentVoiceAudioRef = useRef<HTMLAudioElement | null>(null);
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

  const stopVoice = () => {
    if (currentVoiceAudioRef.current) {
      try {
        currentVoiceAudioRef.current.pause();
        currentVoiceAudioRef.current.currentTime = 0;
      } catch (err) {
        console.log('Error deteniendo voz:', err);
      }
      currentVoiceAudioRef.current = null;
    }
  };

  const playVoice = async (audioPath: string): Promise<number> => {
    // Detener cualquier audio anterior ANTES de crear el nuevo
    stopVoice();
    
    return new Promise((resolve, reject) => {
      if (isSoundEnabled && audioPath) {
        // Verificación adicional: si por alguna razón aún hay un audio, detenerlo
        if (currentVoiceAudioRef.current) {
          stopVoice();
        }
        
        const voiceAudio = new Audio(audioPath);
        voiceAudio.volume = 0.40;
        currentVoiceAudioRef.current = voiceAudio;
        let resolved = false;
        
        const handleResolve = (duration: number) => {
          // Verificar que este audio sigue siendo el actual antes de reproducir
          if (!resolved && currentVoiceAudioRef.current === voiceAudio) {
            resolved = true;
            voiceAudio.play().catch(err => {
              console.log('Error reproduciendo voz:', err);
              if (currentVoiceAudioRef.current === voiceAudio) {
                currentVoiceAudioRef.current = null;
              }
              reject(err);
            });
            resolve(duration);
          } else if (!resolved) {
            // Si otro audio ya empezó, cancelar este
            resolved = true;
            voiceAudio.pause();
            reject(new Error('Audio cancelado: se inició otro audio'));
          }
        };
        
        // Limpiar referencia cuando termine el audio
        voiceAudio.addEventListener('ended', () => {
          if (currentVoiceAudioRef.current === voiceAudio) {
            currentVoiceAudioRef.current = null;
          }
        }, { once: true });
        
        // Obtener la duración del audio cuando los metadatos estén cargados
        voiceAudio.addEventListener('loadedmetadata', () => {
          // Verificar que este sigue siendo el audio actual
          if (currentVoiceAudioRef.current === voiceAudio) {
            const duration = voiceAudio.duration;
            handleResolve(duration);
          }
        }, { once: true });
        
        voiceAudio.addEventListener('error', (err) => {
          console.log('Error cargando audio:', err);
          if (currentVoiceAudioRef.current === voiceAudio) {
            currentVoiceAudioRef.current = null;
          }
          if (!resolved) {
            resolved = true;
            reject(err);
          }
        }, { once: true });
        
        // Si ya tiene duración disponible (audio ya cargado)
        if (voiceAudio.readyState >= 2 && voiceAudio.duration) {
          // Verificar que sigue siendo el audio actual antes de resolver
          if (currentVoiceAudioRef.current === voiceAudio) {
            handleResolve(voiceAudio.duration);
          } else {
            resolved = true;
            reject(new Error('Audio cancelado: se inició otro audio'));
          }
        }
        
        // Fallback: si después de un tiempo no se cargó, usar 0
        setTimeout(() => {
          if (!resolved && voiceAudio.readyState >= 2) {
            // Verificar que sigue siendo el audio actual
            if (currentVoiceAudioRef.current === voiceAudio) {
              handleResolve(voiceAudio.duration || 3); // Default 3 segundos si no hay duración
            } else {
              resolved = true;
              reject(new Error('Audio cancelado: se inició otro audio'));
            }
          }
        }, 100);
      } else {
        resolve(0);
      }
    });
  };

  return (
    <AudioContext.Provider value={{
      isMusicEnabled,
      isSoundEnabled,
      toggleMusic,
      toggleSound,
      playEffect,
      restartMusic,
      playVoice,
      stopVoice
    }}>
      {children}
    </AudioContext.Provider>
  );
};

