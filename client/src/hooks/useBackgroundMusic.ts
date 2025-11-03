import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const useBackgroundMusic = () => {
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const location = useLocation();
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Inicializar música solo una vez
    if (!isInitializedRef.current && !bgMusicRef.current) {
      bgMusicRef.current = new Audio('/music/bg.mp3');
      bgMusicRef.current.loop = true;
      bgMusicRef.current.volume = 0;
      
      // Intentar reproducir con fade in después de un pequeño delay
      const fadeIn = () => {
        if (bgMusicRef.current) {
          bgMusicRef.current.play().catch(err => {
            console.log('Error reproducing background music:', err);
          });
          
          // Fade in durante 2 segundos
          const fadeInterval = setInterval(() => {
            if (bgMusicRef.current && bgMusicRef.current.volume < 0.4) {
              bgMusicRef.current.volume = Math.min(bgMusicRef.current.volume + 0.02, 0.4);
            } else {
              clearInterval(fadeInterval);
            }
          }, 50);
        }
      };
      
      const musicTimer = setTimeout(fadeIn, 500);
      isInitializedRef.current = true;
      
      return () => {
        clearTimeout(musicTimer);
      };
    }
  }, []);

  // Detectar cambios de ruta y hacer pequeño fade durante transiciones
  useEffect(() => {
    if (!bgMusicRef.current) return;

    // Limpiar timeout anterior si existe
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }

    // Fade out ligero (hasta 0.25) durante la transición
    const fadeOut = () => {
      if (bgMusicRef.current) {
        const targetVolume = 0.25;
        const fadeInterval = setInterval(() => {
          if (bgMusicRef.current && bgMusicRef.current.volume > targetVolume) {
            bgMusicRef.current.volume = Math.max(bgMusicRef.current.volume - 0.05, targetVolume);
          } else {
            clearInterval(fadeInterval);
          }
        }, 30);
      }
    };

    // Fade in de vuelta después de la transición
    const fadeIn = () => {
      if (bgMusicRef.current) {
        const targetVolume = 0.4;
        const fadeInterval = setInterval(() => {
          if (bgMusicRef.current && bgMusicRef.current.volume < targetVolume) {
            bgMusicRef.current.volume = Math.min(bgMusicRef.current.volume + 0.03, targetVolume);
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
  }, [location.pathname]);

  // Cleanup final al desmontar
  useEffect(() => {
    return () => {
      if (bgMusicRef.current) {
        // Fade out completo antes de detener
        const fadeInterval = setInterval(() => {
          if (bgMusicRef.current && bgMusicRef.current.volume > 0) {
            bgMusicRef.current.volume = Math.max(bgMusicRef.current.volume - 0.05, 0);
          } else {
            clearInterval(fadeInterval);
            if (bgMusicRef.current) {
              bgMusicRef.current.pause();
              bgMusicRef.current = null;
            }
          }
        }, 50);
      }
    };
  }, []);
};

