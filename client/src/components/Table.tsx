import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';
import '../assets/font.css';
import { useActions } from '../hooks/useActions';
import { useGameData } from '../hooks/useGameData';

type GamePhase = 'intro' | 'choices' | 'result-animation' | 'result-dialogues' | 'game-ended';

export default function TableScreen() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { play, loading: actionLoading, error: actionError } = useActions();
  const gameIdNumber = gameId ? parseInt(gameId, 10) : undefined;
  const { game, refetch: refetchGameData } = useGameData(gameIdNumber);
  
  // UI State
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const playSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Game Phase Management
  const [gamePhase, setGamePhase] = useState<GamePhase>('intro');
  
  // Intro Dialogues State
  const [displayText, setDisplayText] = useState('');
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [isTextComplete, setIsTextComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Choices State
  const [showChoices, setShowChoices] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null);
  
  // Result Animation State
  const [animationComplete, setAnimationComplete] = useState(false);
  const gameResult = useRef<{
    playerChoice: number;
    tomieChoice: number;
    winner: 'DRAW' | 'PLAYER_WINS' | 'TOMIE_WINS';
  } | null>(null);
  
  // Result Dialogues State
  const [resultDialogues, setResultDialogues] = useState<string[]>([]);
  const [currentResultDialogueIndex, setCurrentResultDialogueIndex] = useState(0);
  const [isResultTextComplete, setIsResultTextComplete] = useState(false);
  const [isChoicePromptAnimating, setIsChoicePromptAnimating] = useState(false);
  
  // Game End State
  const [gameEndDialogues, setGameEndDialogues] = useState<string[]>([]);
  const [currentGameEndDialogueIndex, setCurrentGameEndDialogueIndex] = useState(0);
  const [isGameEndTextComplete, setIsGameEndTextComplete] = useState(false);
  const [playerWon, setPlayerWon] = useState<boolean | null>(null);
  const [isGameEnding, setIsGameEnding] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

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
  
  const introDialogues = [
    "Tomie: We're going to play rock, paper, scissors. Simple, right?",
    "Tomie: But there's something more to this game than meets the eye. Let's see what happens..."
  ];
  
  const choicePrompt = "Tomie: What do you choose?";
  
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

  // Intro Dialogues Effect
  useEffect(() => {
    if (gamePhase !== 'intro') return;
    
    // Si ya terminamos todos los diálogos, pasar a choices con animación
    if (currentDialogueIndex >= introDialogues.length) {
      setGamePhase('choices');
      setIsChoicePromptAnimating(true);
      setDisplayText('');
      
      // Animación del texto de selección
      let choiceIndex = 0;
      const choiceInterval = setInterval(() => {
        if (choiceIndex < choicePrompt.length) {
          setDisplayText(choicePrompt.slice(0, choiceIndex + 1));
          choiceIndex++;
        } else {
          clearInterval(choiceInterval);
          setIsChoicePromptAnimating(false);
          setShowChoices(true);
        }
      }, 50);
      
      return () => clearInterval(choiceInterval);
    }
    
    setDisplayText('');
    setIsTextComplete(false);
    const currentDialogue = introDialogues[currentDialogueIndex];
    const currentIndexRef = { value: 0 };
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
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
        timeoutRef.current = setTimeout(() => {
          if (currentDialogueIndex < introDialogues.length - 1) {
            setCurrentDialogueIndex(prev => prev + 1);
          } else {
            // Si es el último diálogo, pasar directamente a choices con animación
            setGamePhase('choices');
            setIsChoicePromptAnimating(true);
            setDisplayText('');
            
            // Animación del texto de selección
            let choiceIndex = 0;
            const choiceInterval = setInterval(() => {
              if (choiceIndex < choicePrompt.length) {
                setDisplayText(choicePrompt.slice(0, choiceIndex + 1));
                choiceIndex++;
              } else {
                clearInterval(choiceInterval);
                setIsChoicePromptAnimating(false);
                setShowChoices(true);
              }
            }, 50);
          }
        }, 2000);
      }
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentDialogueIndex, gamePhase]);

  const handleDialogueClick = () => {
    if (gamePhase === 'intro') {
      const currentDialogue = introDialogues[currentDialogueIndex];
      if (!isTextComplete) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(currentDialogue);
        setIsTextComplete(true);
        timeoutRef.current = setTimeout(() => {
          if (currentDialogueIndex < introDialogues.length - 1) {
            setCurrentDialogueIndex(prev => prev + 1);
          } else {
            setDisplayText(choicePrompt);
            setGamePhase('choices');
            setShowChoices(true);
          }
        }, 2000);
      } else {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (currentDialogueIndex < introDialogues.length - 1) {
          setCurrentDialogueIndex(prev => prev + 1);
        } else {
          // Si es el último diálogo, pasar a choices con animación
          setGamePhase('choices');
          setIsChoicePromptAnimating(true);
          setDisplayText('');
          
          // Animación del texto de selección
          let choiceIndex = 0;
          const choiceInterval = setInterval(() => {
            if (choiceIndex < choicePrompt.length) {
              setDisplayText(choicePrompt.slice(0, choiceIndex + 1));
              choiceIndex++;
            } else {
              clearInterval(choiceInterval);
              setIsChoicePromptAnimating(false);
              setShowChoices(true);
            }
          }, 50);
        }
      }
    } else if (gamePhase === 'result-dialogues') {
      handleResultDialogueClick();
    } else if (gamePhase === 'game-ended') {
      handleGameEndDialogueClick();
    }
  };
  
  const handleResultDialogueClick = () => {
    if (!isResultTextComplete && resultDialogues[currentResultDialogueIndex]) {
      setDisplayText(resultDialogues[currentResultDialogueIndex]);
      setIsResultTextComplete(true);
      const timeout = setTimeout(() => {
        if (currentResultDialogueIndex < resultDialogues.length - 1) {
          setCurrentResultDialogueIndex(prev => prev + 1);
        } else {
          setCurrentResultDialogueIndex(prev => prev + 1);
        }
      }, 2000);
      return () => clearTimeout(timeout);
    } else if (isResultTextComplete) {
      if (currentResultDialogueIndex < resultDialogues.length - 1) {
        setCurrentResultDialogueIndex(prev => prev + 1);
      } else {
        // Si es el último diálogo, incrementar para disparar transición
        setCurrentResultDialogueIndex(prev => prev + 1);
      }
    }
  };
  
  const handleGameEndDialogueClick = () => {
    if (!isGameEndTextComplete && gameEndDialogues[currentGameEndDialogueIndex]) {
      setDisplayText(gameEndDialogues[currentGameEndDialogueIndex]);
      setIsGameEndTextComplete(true);
      const timeout = setTimeout(() => {
        if (currentGameEndDialogueIndex < gameEndDialogues.length - 1) {
          setCurrentGameEndDialogueIndex(prev => prev + 1);
        } else {
          // Activar fade a negro antes de redirigir
          setIsFadingOut(true);
          setTimeout(() => {
            navigate(playerWon ? '/victory' : '/defeat');
          }, 2000);
        }
      }, 2000);
      return () => clearTimeout(timeout);
    } else if (isGameEndTextComplete) {
      if (currentGameEndDialogueIndex < gameEndDialogues.length - 1) {
        setCurrentGameEndDialogueIndex(prev => prev + 1);
      } else {
        // Activar fade a negro antes de redirigir
        setIsFadingOut(true);
        setTimeout(() => {
          navigate(playerWon ? '/victory' : '/defeat');
        }, 2000);
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
      playRandomSound();
      const result = await play(gameIdNumber, choiceNumber);
      
      if (result && result.parsed_events) {
        console.log('Play result:', result);
        
        // Check for GameEndedEvent first (but don't process it yet, wait for result animation)
        const gameEndEvent = result.parsed_events.find(
          (event) => event.key === 'GameEndedEvent'
        );
        
        if (gameEndEvent && gameEndEvent.data) {
          // Parse player_won from Starknet event (could be boolean, string, or number)
          const wonValue = gameEndEvent.data.player_won;
          const won = wonValue === true || wonValue === 1 || wonValue === '1' || String(wonValue).toLowerCase() === 'true';
          setPlayerWon(won);
          setIsGameEnding(true);
          
          const endDialogues = won
            ? [
                "Tomie: You've won... this time.",
              ]
            : [
                "Tomie: You've lost... as expected.",
              ];
          
          setGameEndDialogues(endDialogues);
        }
        
        // Handle YanKenPonResultEvent (round result)
        const resultEvent = result.parsed_events.find(
          (event) => event.key === 'YanKenPonResultEvent'
        );
        
        if (resultEvent && resultEvent.data) {
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
          
          const dialoguesByResult = {
            'DRAW': [
              "Tomie: A draw? How interesting... This means we're evenly matched.",
            ],
            'PLAYER_WINS': [
              "Tomie: You won this round...",
            ],
            'TOMIE_WINS': [
              "Tomie: I win this round.",
            ]
          };
          
          setResultDialogues(dialoguesByResult[gameResult.current.winner]);
          setGamePhase('result-animation');
          setShowChoices(false);
          
          setTimeout(() => {
            setAnimationComplete(true);
          }, 1800);
          
          setTimeout(() => {
            setGamePhase('result-dialogues');
            setCurrentResultDialogueIndex(0);
            setIsResultTextComplete(false);
            // Refetch game data after animation to get updated state
            refetchGameData();
          }, 4500);
        } else {
          // Si no hay resultado pero sí hay GameEndedEvent, refetch igual
          if (gameEndEvent) {
            refetchGameData();
          }
        }
      }
    } catch (err) {
      console.error('Error playing:', err);
      setSelectedChoice(null);
      setGamePhase('choices');
    }
  };

  // Calcular transformaciones basadas en mouse (parallax effect)
  const bgX = mousePosition.x * 15;
  const bgY = mousePosition.y * 15;
  const handPlayerX = mousePosition.x * 20;
  const handPlayerY = mousePosition.y * 20;
  const handTomieX = mousePosition.x * 20;
  const handTomieY = mousePosition.y * 20;

  // Result Dialogues Effect
  useEffect(() => {
    if (gamePhase !== 'result-dialogues') return;
    
    // Si ya terminamos todos los diálogos
    if (currentResultDialogueIndex >= resultDialogues.length) {
      const restoreTimer = setTimeout(() => {
        // Si el juego terminó, pasar a game-ended
        if (isGameEnding) {
          setGamePhase('game-ended');
          setCurrentGameEndDialogueIndex(0);
          setIsGameEndTextComplete(false);
          setAnimationComplete(false);
          setCurrentResultDialogueIndex(0);
          setResultDialogues([]);
          gameResult.current = null;
          setIsGameEnding(false); // Reset flag
        } else {
          // Si no terminó, volver a choices con animación
          setGamePhase('choices');
          setIsChoicePromptAnimating(true);
          setDisplayText('');
          setIsResultTextComplete(false);
          
          // Animación del texto de selección
          let choiceIndex = 0;
          const choiceInterval = setInterval(() => {
            if (choiceIndex < choicePrompt.length) {
              setDisplayText(choicePrompt.slice(0, choiceIndex + 1));
              choiceIndex++;
            } else {
              clearInterval(choiceInterval);
              setIsChoicePromptAnimating(false);
              setIsResultTextComplete(true);
              setShowChoices(true);
            }
          }, 50);
          
          setSelectedChoice(null);
          setAnimationComplete(false);
          setCurrentResultDialogueIndex(0);
          setResultDialogues([]);
          gameResult.current = null;
        }
      }, 500); // Reducido de 2000ms a 500ms
      return () => clearTimeout(restoreTimer);
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
          } else {
            // Si es el último diálogo, incrementar índice para disparar la transición
            setCurrentResultDialogueIndex(prev => prev + 1);
          }
        }, 2000); // Reducido de 5000ms a 2000ms
      }
    }, 50);

    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentResultDialogueIndex, gamePhase, resultDialogues, isGameEnding]);
  
  // Game End Dialogues Effect
  useEffect(() => {
    if (gamePhase !== 'game-ended' || currentGameEndDialogueIndex >= gameEndDialogues.length) {
      return;
    }
    
    setDisplayText('');
    setIsGameEndTextComplete(false);
    const currentDialogue = gameEndDialogues[currentGameEndDialogueIndex];
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const interval = setInterval(() => {
      if (currentIndex < currentDialogue.length) {
        setDisplayText(currentDialogue.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsGameEndTextComplete(true);
        timeoutId = setTimeout(() => {
          if (currentGameEndDialogueIndex < gameEndDialogues.length - 1) {
            setCurrentGameEndDialogueIndex(prev => prev + 1);
          } else {
            // Activar fade a negro antes de redirigir
            setIsFadingOut(true);
            setTimeout(() => {
              navigate(playerWon ? '/victory' : '/defeat');
            }, 2000);
          }
        }, 3000);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentGameEndDialogueIndex, gamePhase, gameEndDialogues, playerWon, navigate]);

  return (
    <div ref={tableRef} className="table-screen">
      <div 
        className={`table-background ${isLoaded ? 'fade-in' : ''} ${gamePhase === 'result-animation' ? 'darkened' : ''}`}
        style={{
          transform: `translate(calc(-50% + ${bgX}px), calc(-50% + ${bgY}px)) scale(1.08)`,
        }}
      >
        <img src="/backgrounds/table_bg.png" alt="Table background" />
      </div>
      
      {gamePhase !== 'result-animation' && (
        <div className={`table-face-popup ${isLoaded ? 'fade-in-delay' : ''}`}>
          <img src="/backgrounds/face_2.png" alt="Face" />
        </div>
      )}

      {/* Game Status Box */}
      {game && (
        <div className={`game-status-box ${isLoaded ? 'fade-in-delay' : ''}`}>
          <div className="game-status-content">
            <div className="game-status-title">Jankenpon</div>
            <div className="game-status-info">
              <div className="game-status-item">
                <span className="game-status-label">Player:</span>
                <span className="game-status-value">{Number(game.lives)}</span>
              </div>
              <div className="game-status-item">
                <span className="game-status-label">Tomie:</span>
                <span className="game-status-value">{Number(game.tomie_lives)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div 
        className={`game-text-box ${isLoaded ? 'fade-in-delay-2' : ''}`}
        onClick={handleDialogueClick}
        style={{ 
          cursor: (gamePhase === 'intro' || gamePhase === 'result-dialogues' || gamePhase === 'game-ended') ? 'pointer' : 'default' 
        }}
      >
        <div className="game-text-content">
          {displayText}
          {((gamePhase === 'intro' && !isTextComplete) || 
            (gamePhase === 'result-dialogues' && !isResultTextComplete) ||
            (gamePhase === 'game-ended' && !isGameEndTextComplete) ||
            (gamePhase === 'choices' && isChoicePromptAnimating)) && (
            <span className="cursor">|</span>
          )}
        </div>
      </div>

      {showChoices && gamePhase === 'choices' && (
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

      {gamePhase === 'result-animation' && gameResult.current && (
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

      {/* Fade a negro */}
      <div className={`fade-to-black ${isFadingOut ? 'fade-out-active' : ''}`}></div>
    </div>
  );
}
