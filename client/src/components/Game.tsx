import { useState, useEffect, useRef } from 'react';
import '../App.css';
import '../assets/font.css';
import { useActions } from '../hooks/useActions';
import { useNavigate } from 'react-router-dom';

export default function GameScreen() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [displayText, setDisplayText] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [showFacePopup, setShowFacePopup] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const { newGame, loading: actionLoading, error: actionError } = useActions();
  
  const idleText = "Tomie: Since you've made it this far, why not play a little game?";
  const waitingText = "Tomie: What taking so long, you are not going to run away now, are you?"

  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  // Mostrar el botón después de 2.5 segundos
  useEffect(() => {
    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, 2500);

    return () => clearTimeout(buttonTimer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWaiting(true);
    }, 10000); 

    return () => clearTimeout(timer);
  }, []);

  // Mostrar el cuadro emergente cuando isWaiting se activa
  useEffect(() => {
    if (isWaiting) {
      setShowFacePopup(true);
      setIsFadingOut(false);
      const hideTimer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setShowFacePopup(false);
        }, 500); // Esperar a que termine la animación de fade-out
      }, 3000); // Ocultar después de 2 segundos

      return () => clearTimeout(hideTimer);
    }
  }, [isWaiting]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gameRef.current) {
        const rect = gameRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
        setMousePosition({ x, y });
      }
    };

    const gameElement = gameRef.current;
    if (gameElement) {
      gameElement.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (gameElement) {
        gameElement.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  // Animación de escritura que se reinicia cuando cambia el estado
  useEffect(() => {
    setDisplayText(''); // Reiniciar el texto
    const currentText = isWaiting ? waitingText : idleText;
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < currentText.length) {
        setDisplayText(currentText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isWaiting]);

  // Calcular transformaciones basadas en mouse (parallax effect)
  const bgX = mousePosition.x * 15;
  const bgY = mousePosition.y * 15;
  const charX = mousePosition.x * 30;
  const charY = mousePosition.y * 30;

  const handleNewGame = async () => {
    try {
      const result = await newGame();
      if (result && result.game_id) {
        console.log('New game created:', result);
        const gameId = typeof result.game_id === 'bigint' ? result.game_id.toString() : String(result.game_id);
        navigate(`/game/${gameId}`);
      }
    } catch (err) {
      console.error('Error creating new game:', err);
    }
  };

  return (
    <div ref={gameRef} className="game-screen">
      <div 
        className={`game-background ${isLoaded ? 'fade-in' : ''} ${isWaiting ? 'darkened' : ''}`}
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
        <img src={`/backgrounds/char_${isWaiting ? '1' : '1'}.png`} alt="Character" />
      </div>
      
      <div className={`game-text-box ${isLoaded ? 'fade-in-delay-2' : ''}`}>
        <div className="game-text-content">
          {displayText}
          <span className="cursor">|</span>
        </div>
      </div>

      {showButton && (
        <div className={`game-action-button ${showButton ? 'fade-in-delay-2' : ''}`}>
          <button 
            onClick={handleNewGame} 
            disabled={actionLoading}
            className="game-button"
          >
            {actionLoading ? 'Loading...' : 'uhm.. sure?'}
          </button>
        </div>
      )}

      {actionError && (
        <div className="game-error-message">
          {actionError}
        </div>
      )}

      {showFacePopup && (
        <div className={`face-popup ${isFadingOut ? 'fade-out-popup' : 'fade-in-popup'}`}>
          <img src="/backgrounds/face_1.png" alt="Face" />
        </div>
      )}
    </div>
  );
}
