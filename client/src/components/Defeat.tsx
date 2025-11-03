import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDisconnect } from '@starknet-react/core';
import { useAudio } from '../hooks/useAudio';
import '../App.css';
import '../assets/font.css';

export default function DefeatScreen() {
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();
  const { restartMusic, playVoice } = useAudio();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [displayText, setDisplayText] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTextComplete, setIsTextComplete] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const defeatRef = useRef<HTMLDivElement>(null);
  
  const defeatText = "Tomie: You’re not the first to lose here... and you won’t be leaving. Ever.";

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (defeatRef.current) {
        const rect = defeatRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
        setMousePosition({ x, y });
      }
    };

    const defeatElement = defeatRef.current;
    if (defeatElement) {
      defeatElement.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (defeatElement) {
        defeatElement.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  // Animación de escritura
  useEffect(() => {
    setDisplayText('');
    setIsTextComplete(false);
    let currentIndex = 0;
    let interval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let calculatedIntervalMs = 50; // Default
    let estimatedDuration = 3000; // Default en ms
    
    // Iniciar animación inmediatamente para evitar parpadeos
    interval = setInterval(() => {
      if (currentIndex < defeatText.length) {
        setDisplayText(defeatText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        if (interval) clearInterval(interval);
        interval = null;
        setIsTextComplete(true);
        timeoutId = setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            disconnect();
            restartMusic();
            navigate('/');
          }, 2000);
        }, estimatedDuration + 500);
      }
    }, calculatedIntervalMs);
    
    // Ajustar velocidad cuando el audio cargue
    playVoice('/music/defeatText.mp3').then((duration) => {
      if (duration > 0 && currentIndex < defeatText.length) {
        estimatedDuration = duration * 1000;
        const charsPerSecond = defeatText.length / duration;
        const newIntervalMs = Math.max(30, Math.min(100, 1000 / charsPerSecond));
        
        if (Math.abs(newIntervalMs - calculatedIntervalMs) > 10 && interval) {
          calculatedIntervalMs = newIntervalMs;
          clearInterval(interval);
          interval = setInterval(() => {
            if (currentIndex < defeatText.length) {
              setDisplayText(defeatText.slice(0, currentIndex + 1));
              currentIndex++;
            } else {
              if (interval) clearInterval(interval);
              interval = null;
              setIsTextComplete(true);
              timeoutId = setTimeout(() => {
                setIsFadingOut(true);
                setTimeout(() => {
                  disconnect();
                  restartMusic();
                  navigate('/');
                }, 2000);
              }, estimatedDuration + 500);
            }
          }, calculatedIntervalMs);
        }
      }
    }).catch(err => {
      console.error('Error reproduciendo voz:', err);
      // Continuar con velocidad default
    });

    return () => {
      if (interval) clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate, disconnect, restartMusic, playVoice]);


  // Calcular transformaciones basadas en mouse (parallax effect)
  const bgX = mousePosition.x * 15;
  const bgY = mousePosition.y * 15;
  const charX = mousePosition.x * 30;
  const charY = mousePosition.y * 30;

  return (
    <div ref={defeatRef} className="game-screen">
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
        <img src="/backgrounds/char_2.png" alt="Character" />
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

