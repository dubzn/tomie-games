import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDisconnect } from '@starknet-react/core';
import { useAudio } from '../hooks/useAudio';
import '../App.css';
import '../assets/font.css';

export default function VictoryScreen() {
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();
  const { restartMusic, playVoice } = useAudio();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [displayText, setDisplayText] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTextComplete, setIsTextComplete] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showHouseTransition, setShowHouseTransition] = useState(false);
  const [narrationTextDisplay, setNarrationTextDisplay] = useState('');
  const [isNarrationComplete, setIsNarrationComplete] = useState(false);
  const victoryRef = useRef<HTMLDivElement>(null);
  
  const victoryText = "Tomie:\n What a shame. I would've liked to play with you a little longer.";
  const narrationText = "Without looking back, you walk away. Maybe it was luck... but you survived."

  useEffect(() => {
    setIsLoaded(true);
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
    
    // Reproducir audio de voz cuando comienza el texto
    playVoice('/music/victoryText.mp3');
    
    const interval = setInterval(() => {
      if (currentIndex < victoryText.length) {
        setDisplayText(victoryText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsTextComplete(true);
        // Esperar 3 segundos después de que termine el texto, luego mostrar transición de casa
        setTimeout(() => {
          setShowHouseTransition(true);
        }, 3000);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [navigate, disconnect, restartMusic, victoryText, playVoice]);

  // Efecto para la transición de narración con la casa
  useEffect(() => {
    if (!showHouseTransition) return;

    // Iniciar animación de escritura de narración
    setNarrationTextDisplay('');
    setIsNarrationComplete(false);
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < narrationText.length) {
        setNarrationTextDisplay(narrationText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsNarrationComplete(true);
        // Esperar 3 segundos después del texto de narración, luego fade y redirigir
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            disconnect();
            restartMusic(); // Reiniciar la música antes de navegar
            navigate('/');
          }, 2000); // Tiempo para el fade a negro
        }, 3000);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [showHouseTransition, narrationText, navigate, disconnect, restartMusic]);


  // Calcular transformaciones basadas en mouse (parallax effect)
  const bgX = mousePosition.x * 15;
  const bgY = mousePosition.y * 15;
  const charX = mousePosition.x * 30;
  const charY = mousePosition.y * 30;

  return (
    <div ref={victoryRef} className="game-screen">
      {!showHouseTransition ? (
        <>
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
        </>
      ) : (
        <>
          {/* Imagen de la casa oscurecida */}
          <div 
            className="house-transition-background"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
              zIndex: 1,
            }}
          >
            <img 
              src="/backgrounds/house.png" 
              alt="House" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.5)',
              }}
            />
          </div>
          
          {/* Cuadro de diálogo de narración */}
          <div className="game-text-box fade-in-delay-2">
            <div className="game-text-content">
              {narrationTextDisplay}
              {!isNarrationComplete && (
                <span className="cursor">|</span>
              )}
            </div>
          </div>
        </>
      )}

      {/* Fade a negro */}
      <div className={`fade-to-black ${isFadingOut ? 'fade-out-active' : ''}`}></div>
    </div>
  );
}

