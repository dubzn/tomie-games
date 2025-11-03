import { useState, useEffect, useRef } from 'react';
import '../App.css';
import '../assets/font.css';
import { useActions } from '../hooks/useActions';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '../hooks/useAudio';

export default function GameScreen() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [displayText, setDisplayText] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [showFacePopup, setShowFacePopup] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isFadingToTable, setIsFadingToTable] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const { newGame, loading: actionLoading, error: actionError } = useActions();
  const { playVoice } = useAudio();
  
  const idleText = "Tomie: Since you've accepted my invitation... how about a little game?";
  const waitingText = "Tomie: What's taking so long? You're not thinking of running away... are you?";
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  useEffect(() => {
    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, 2500);

    return () => clearTimeout(buttonTimer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWaiting(true);
    }, 15000); 

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isWaiting) {
      setShowFacePopup(true);
      setIsFadingOut(false);
      const hideTimer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setShowFacePopup(false);
        }, 500);
      }, 3000);

      return () => clearTimeout(hideTimer);
    }
  }, [isWaiting]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gameRef.current) {
        const rect = gameRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
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

  useEffect(() => {
    setDisplayText('');
    const currentText = isWaiting ? waitingText : idleText;
    const audioPath = isWaiting ? '/music/waitingText.mp3' : '/music/idleText.mp3';
    let currentIndex = 0;
    let interval: NodeJS.Timeout | null = null;
    let calculatedIntervalMs = 50; // Default
    
    // Iniciar animación inmediatamente para evitar parpadeos
    interval = setInterval(() => {
      if (currentIndex < currentText.length) {
        setDisplayText(currentText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        if (interval) clearInterval(interval);
        interval = null;
      }
    }, calculatedIntervalMs);
    
    // Ajustar velocidad cuando el audio cargue
    playVoice(audioPath).then((duration) => {
      if (duration > 0 && currentIndex < currentText.length) {
        const charsPerSecond = currentText.length / duration;
        const newIntervalMs = Math.max(30, Math.min(100, 1000 / charsPerSecond));
        
        if (Math.abs(newIntervalMs - calculatedIntervalMs) > 10 && interval) {
          calculatedIntervalMs = newIntervalMs;
          clearInterval(interval);
          interval = setInterval(() => {
            if (currentIndex < currentText.length) {
              setDisplayText(currentText.slice(0, currentIndex + 1));
              currentIndex++;
            } else {
              if (interval) clearInterval(interval);
              interval = null;
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
    };
  }, [isWaiting, playVoice]);

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
        // Activar fade a negro antes de navegar
        setIsFadingToTable(true);
        setTimeout(() => {
          navigate(`/game/${gameId}`);
        }, 2000); // Tiempo para el fade a negro
      }
    } catch (err) {
      console.error('Error creating new game:', err);
      setIsFadingToTable(false); // Cancelar fade si hay error
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
            disabled={actionLoading || isFadingToTable }
            className="game-button"
          >
            {actionLoading || isFadingToTable ? 'Loading...' : 'uhm.. sure?'}
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

      {/* Fade a negro */}
      <div className={`fade-to-black ${isFadingToTable ? 'fade-out-active' : ''}`}></div>
    </div>
  );
}
