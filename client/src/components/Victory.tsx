import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDisconnect } from '@starknet-react/core';
import '../App.css';
import '../assets/font.css';

export default function VictoryScreen() {
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [displayText, setDisplayText] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTextComplete, setIsTextComplete] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const victoryRef = useRef<HTMLDivElement>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  
  const victoryText = "Tomie: You've won... this time. But remember, victory doesn't always mean you're free.";

  useEffect(() => {
    setIsLoaded(true);
    
    // Inicializar y reproducir música de fondo con fade in
    bgMusicRef.current = new Audio('/music/bg.mp3');
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0;
    
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
    
    // Pequeño delay antes de empezar la música
    const musicTimer = setTimeout(fadeIn, 500);
    
    return () => {
      clearTimeout(musicTimer);
      if (bgMusicRef.current) {
        // Fade out antes de detener
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (victoryRef.current) {
        const rect = victoryRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
        setMousePosition({ x, y });
      }
    };

    const victoryElement = victoryRef.current;
    if (victoryElement) {
      victoryElement.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (victoryElement) {
        victoryElement.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  // Animación de escritura
  useEffect(() => {
    setDisplayText('');
    setIsTextComplete(false);
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < victoryText.length) {
        setDisplayText(victoryText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsTextComplete(true);
        // Esperar 3 segundos después de que termine el texto, luego fade a negro y redirigir
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            disconnect();
            navigate('/');
          }, 2000); // Tiempo para el fade a negro
        }, 3000);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [navigate, disconnect, victoryText]);

  // Fade out de música cuando hay transición
  useEffect(() => {
    if (isFadingOut && bgMusicRef.current) {
      const fadeInterval = setInterval(() => {
        if (bgMusicRef.current && bgMusicRef.current.volume > 0) {
          bgMusicRef.current.volume = Math.max(bgMusicRef.current.volume - 0.05, 0);
        } else {
          clearInterval(fadeInterval);
          if (bgMusicRef.current) {
            bgMusicRef.current.pause();
          }
        }
      }, 50);
      
      return () => clearInterval(fadeInterval);
    }
  }, [isFadingOut]);

  // Calcular transformaciones basadas en mouse (parallax effect)
  const bgX = mousePosition.x * 15;
  const bgY = mousePosition.y * 15;
  const charX = mousePosition.x * 30;
  const charY = mousePosition.y * 30;

  return (
    <div ref={victoryRef} className="game-screen">
      <div 
        className={`game-background ${isLoaded ? 'fade-in' : ''} darkened`}
        style={{
          transform: `translate(calc(-50% + ${bgX}px), calc(-50% + ${bgY}px)) scale(1.08)`,
        }}
      >
        <img src="/backgrounds/game_bg.png" alt="Game background" />
      </div>
      
      <div 
        className={`game-character ${isLoaded ? 'fade-in-delay' : ''}`}
        style={{
          transform: `translate(calc(-50% + ${charX}px), calc(-50% + ${charY}px))`,
        }}
      >
        <img src="/backgrounds/char_1.png" alt="Character" />
      </div>
      
      <div className={`game-text-box ${isLoaded ? 'fade-in-delay-2' : ''}`}>
        <div className="game-text-content">
          {displayText}
          {!isTextComplete && (
            <span className="cursor">|</span>
          )}
        </div>
      </div>

      {/* Fade a negro */}
      <div className={`fade-to-black ${isFadingOut ? 'fade-out-active' : ''}`}></div>
    </div>
  );
}

