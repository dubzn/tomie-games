import { useState, useEffect, useRef } from 'react';
import '../App.css';
import '../assets/font.css';

export default function GameScreen() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [displayText, setDisplayText] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  
  const fullText = "Welcome to the game. Let's see what happens next...";

  // Efecto para activar las transiciones al montar
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
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

  // Animación de escritura
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 50); // Velocidad de escritura

    return () => clearInterval(interval);
  }, []);

  // Calcular transformaciones basadas en mouse (parallax effect)
  const bgX = mousePosition.x * 15;
  const bgY = mousePosition.y * 15;
  const charX = mousePosition.x * 30;
  const charY = mousePosition.y * 30;

  return (
    <div ref={gameRef} className="game-screen">
      <div 
        className={`game-background ${isLoaded ? 'fade-in' : ''}`}
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
          <span className="cursor">|</span>
        </div>
      </div>
    </div>
  );
}
