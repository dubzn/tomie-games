import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import '../App.css';
import '../assets/font.css';
import { useActions } from '../hooks/useActions';

export default function TableScreen() {
  const { gameId } = useParams<{ gameId: string }>();
  const { play, loading: actionLoading, error: actionError } = useActions();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [displayText, setDisplayText] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [isTextComplete, setIsTextComplete] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showResultDialogues, setShowResultDialogues] = useState(false);
  const [currentResultDialogueIndex, setCurrentResultDialogueIndex] = useState(0);
  const [isResultTextComplete, setIsResultTextComplete] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const gameResult = useRef<{
    playerChoice: number;
    tomieChoice: number;
    winner: 'DRAW' | 'PLAYER_WINS' | 'TOMIE_WINS';
  } | null>(null);
  const [resultDialogues, setResultDialogues] = useState<string[]>([]);
  const tableRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playSoundRef = useRef<HTMLAudioElement | null>(null);

  // Función para reproducir un audio aleatorio
  const playRandomSound = () => {
    const sounds = [
      '/music/jankenpon_1.mp3',
      '/music/jankenpon_2.mp3',
      '/music/jankenpon_3.mp3'
    ];
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    
    if (playSoundRef.current) {
      playSoundRef.current.pause();
    }
    
    playSoundRef.current = new Audio(randomSound);
    playSoundRef.current.volume = 0.3;
    playSoundRef.current.play().catch(err => {
      console.log('Error reproducing sound:', err);
    });
  };
  
  const dialogues = [
    "Tomie: We're going to play rock, paper, scissors. Simple, right?",
    "Tomie: But there's something more to this game than meets the eye. Let's see what happens...",
    "Tomie: What do you choose?"
  ];
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (tableRef.current) {
        const rect = tableRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
        setMousePosition({ x, y });
      }
    };

    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (tableElement) {
        tableElement.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  // Animación de escritura del diálogo actual
  useEffect(() => {
    if (currentDialogueIndex >= dialogues.length) return;
    
    setDisplayText('');
    setIsTextComplete(false);
    const currentDialogue = dialogues[currentDialogueIndex];
    const currentIndexRef = { value: 0 };
    
    // Limpiar intervalos anteriores
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      if (currentIndexRef.value < currentDialogue.length) {
        setDisplayText(currentDialogue.slice(0, currentIndexRef.value + 1));
        currentIndexRef.value++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsTextComplete(true);
        // Cambiar al siguiente diálogo después de 3 segundos
        timeoutRef.current = setTimeout(() => {
          if (currentDialogueIndex < dialogues.length - 1) {
            setCurrentDialogueIndex(prev => prev + 1);
          } else {
            // Todos los diálogos terminaron, mostrar botones
            setShowChoices(true);
          }
        }, 3000);
      }
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [currentDialogueIndex]);

  const handleClick = () => {
    if (currentDialogueIndex >= dialogues.length) return;

    const currentDialogue = dialogues[currentDialogueIndex];

    // Si el texto no está completo, completarlo inmediatamente
    if (!isTextComplete) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setDisplayText(currentDialogue);
      setIsTextComplete(true);
      
      // Iniciar el timeout para el siguiente diálogo
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (currentDialogueIndex < dialogues.length - 1) {
          setCurrentDialogueIndex(prev => prev + 1);
        } else {
          // Todos los diálogos terminaron, mostrar botones
          setShowChoices(true);
        }
      }, 3000);
    } else {
      // Si el texto está completo, ir al siguiente diálogo inmediatamente
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (currentDialogueIndex < dialogues.length - 1) {
        setCurrentDialogueIndex(prev => prev + 1);
      } else {
        // Todos los diálogos terminaron, mostrar botones
        setShowChoices(true);
      }
    }
  };

  const handleChoice = async (choice: 'rock' | 'paper' | 'scissors') => {
    if (!gameId || selectedChoice) {
      return; // Ya hay una selección en proceso
    }

    // Marcar como seleccionado inmediatamente
    setSelectedChoice(choice);

    // Mapear choice a número: 1 = rock, 2 = paper, 3 = scissors
    const choiceMap: Record<'rock' | 'paper' | 'scissors', number> = {
      rock: 1,
      paper: 2,
      scissors: 3
    };

    const choiceNumber = choiceMap[choice];
    const gameIdNumber = parseInt(gameId, 10);

    if (isNaN(gameIdNumber)) {
      console.error('Invalid gameId:', gameId);
      setSelectedChoice(null);
      return;
    }

    try {
      console.log('Playing gameId:', gameIdNumber, 'with choice:', choiceNumber);
      // Reproducir audio aleatorio al mismo tiempo que se ejecuta la transacción
      playRandomSound();
      const result = await play(gameIdNumber, choiceNumber);
      if (result && result.parsed_events) {
        console.log('Play result:', result);
        // Buscar el evento de resultado
        const resultEvent = result.parsed_events.find(
          (event) => event.key === 'YanKenPonResultEvent'
        );
        
        if (resultEvent && resultEvent.data) {
          // Obtener los números de choice (1, 2, 3)
          const getChoiceNumber = (choice: string): number => {
            switch (choice) {
              case 'ROCK': return 1;
              case 'PAPER': return 2;
              case 'SCISSORS': return 3;
              default: return 1;
            }
          };

          gameResult.current = {
            playerChoice: getChoiceNumber(resultEvent.data.player_choice),
            tomieChoice: getChoiceNumber(resultEvent.data.tomie_choice),
            winner: resultEvent.data.result
          };
          setShowResult(true);
          
          // Configurar diálogos basados en el resultado
          const dialoguesByResult = {
            'DRAW': [
              "Tomie: A draw? How interesting... This means we're evenly matched.",
              "Tomie: But don't think this is over. The real game has just begun."
            ],
            'PLAYER_WINS': [
              "Tomie: You won this round...",
              "Tomie: But remember, winning doesn't always mean you're safe. Sometimes victory comes with a price."
            ],
            'TOMIE_WINS': [
              "Tomie: I win this round.",
              "Tomie: You lose a life, but don't worry... there's still more to come. The game isn't over yet."
            ]
          };
          
          setResultDialogues(dialoguesByResult[gameResult.current.winner]);
          
          // Marcar que la animación está completa después de 1.8 segundos
          setTimeout(() => {
            setAnimationComplete(true);
          }, 1800);
          
          // Después de 4.5 segundos (tiempo de standby para ver las manos), mostrar diálogos
          setTimeout(() => {
            setShowResultDialogues(true);
            setCurrentResultDialogueIndex(0);
          }, 4500);
        }
      }
    } catch (err) {
      console.error('Error playing:', err);
      setSelectedChoice(null); // Resetear si hay error
    }
  };

  // Calcular transformaciones basadas en mouse (parallax effect)
  const bgX = mousePosition.x * 15;
  const bgY = mousePosition.y * 15;
  const handPlayerX = mousePosition.x * 20;
  const handPlayerY = mousePosition.y * 20;
  const handTomieX = mousePosition.x * 20;
  const handTomieY = mousePosition.y * 20;

  // Efecto para los diálogos de resultado
  useEffect(() => {
    if (!showResultDialogues || currentResultDialogueIndex >= resultDialogues.length) {
      // Cuando terminan todos los diálogos de resultado, restaurar todo y mostrar botones
      if (showResultDialogues && currentResultDialogueIndex >= resultDialogues.length) {
        const restoreTimeout = setTimeout(() => {
          setShowResult(false);
          setShowResultDialogues(false);
          setCurrentResultDialogueIndex(0);
          setResultDialogues([]);
          setSelectedChoice(null);
          setAnimationComplete(false);
          gameResult.current = null;
          // Volver a mostrar los botones de selección
          setShowChoices(true);
        }, 3000);
        return () => clearTimeout(restoreTimeout);
      }
      return;
    }
    
    setDisplayText('');
    setIsResultTextComplete(false);
    const currentDialogue = resultDialogues[currentResultDialogueIndex];
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const interval = setInterval(() => {
      if (currentIndex < currentDialogue.length) {
        setDisplayText(currentDialogue.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsResultTextComplete(true);
        timeoutId = setTimeout(() => {
          if (currentResultDialogueIndex < resultDialogues.length - 1) {
            setCurrentResultDialogueIndex(prev => prev + 1);
          }
        }, 5000);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentResultDialogueIndex, showResultDialogues, resultDialogues]);

  return (
    <div ref={tableRef} className="table-screen">
      <div 
        className={`table-background ${isLoaded ? 'fade-in' : ''} ${showResult && !showResultDialogues ? 'darkened' : ''}`}
        style={{
          transform: `translate(calc(-50% + ${bgX}px), calc(-50% + ${bgY}px)) scale(1.08)`,
        }}
      >
        <img src="/backgrounds/table_bg.png" alt="Table background" />
      </div>
      
      {!showResult && (
        <div className={`table-face-popup ${isLoaded ? 'fade-in-delay' : ''}`}>
          <img src="/backgrounds/face_2.png" alt="Face" />
        </div>
      )}

      <div 
        className={`game-text-box ${isLoaded ? 'fade-in-delay-2' : ''}`}
        onClick={() => {
          if (showResultDialogues) {
            // Manejar clicks en diálogos de resultado
            if (!isResultTextComplete && resultDialogues[currentResultDialogueIndex]) {
              setDisplayText(resultDialogues[currentResultDialogueIndex]);
              setIsResultTextComplete(true);
              setTimeout(() => {
                if (currentResultDialogueIndex < resultDialogues.length - 1) {
                  setCurrentResultDialogueIndex(prev => prev + 1);
                }
              }, 3000);
            } else if (isResultTextComplete) {
              if (currentResultDialogueIndex < resultDialogues.length - 1) {
                setCurrentResultDialogueIndex(prev => prev + 1);
              }
            }
          } else {
            handleClick();
          }
        }}
        style={{ cursor: (showResultDialogues || currentDialogueIndex < dialogues.length) ? 'pointer' : 'default' }}
      >
        <div className="game-text-content">
          {displayText}
          {(!showResultDialogues || (showResultDialogues && !isResultTextComplete)) && (
            <span className="cursor">|</span>
          )}
        </div>
      </div>

      {showChoices && !showResult && (
        <div className="choices-container fade-in-choices">
          {(!selectedChoice || selectedChoice === 'rock') && (
            <button 
              className="choice-button"
              onClick={() => handleChoice('rock')}
              disabled={actionLoading || selectedChoice !== null}
            >
              ROCK
            </button>
          )}
          {(!selectedChoice || selectedChoice === 'paper') && (
            <button 
              className="choice-button"
              onClick={() => handleChoice('paper')}
              disabled={actionLoading || selectedChoice !== null}
            >
              PAPER
            </button>
          )}
          {(!selectedChoice || selectedChoice === 'scissors') && (
            <button 
              className="choice-button"
              onClick={() => handleChoice('scissors')}
              disabled={actionLoading || selectedChoice !== null}
            >
              SCISSORS
            </button>
          )}
        </div>
      )}

      {actionError && (
        <div className="game-error-message">
          {actionError}
        </div>
      )}

      {showResult && gameResult.current && !showResultDialogues && (
        <div className="result-animation">
            {/* Mano del jugador desde la izquierda */}
            <div 
              className="result-hand result-hand-player"
              style={animationComplete ? {
                transform: `translate(calc(15% + ${handPlayerX}px), calc(0px + ${handPlayerY}px))`,
              } : {}}
            >
              <img src={`/backgrounds/man_${gameResult.current.playerChoice}.png`} alt="Player hand" />
            </div>

            {/* Mano de Tomie desde la derecha */}
            <div 
              className="result-hand result-hand-tomie"
              style={animationComplete ? {
                transform: `translate(calc(-50% + ${handTomieX}px), calc(-50% + ${handTomieY}px)) rotate(180deg)`,
              } : {}}
            >
              <img src={`/backgrounds/woman_${gameResult.current.tomieChoice}.png`} alt="Tomie hand" />
            </div>

          {/* Texto del resultado */}
          <div className="result-text">
            {gameResult.current.winner === 'DRAW' && 'DRAW!'}
            {gameResult.current.winner === 'PLAYER_WINS' && 'YOU WIN!'}
            {gameResult.current.winner === 'TOMIE_WINS' && 'TOMIE WINS!'}
          </div>
        </div>
      )}
    </div>
  );
}
