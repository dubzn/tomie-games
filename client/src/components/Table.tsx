import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';
import '../assets/font.css';
import { useActions } from '../hooks/useActions';
import { useGameData } from '../hooks/useGameData';
import { useAudio } from '../hooks/useAudio';

type GamePhase = 'intro' | 'choices' | 'result-animation' | 'result-dialogues' | 'game-ended';

export default function TableScreen() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { play, loading: actionLoading, error: actionError } = useActions();
  const { playVoice, stopVoice } = useAudio();
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
  const resultDialogueIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resultDialogueTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Game End State
  const [gameEndDialogues, setGameEndDialogues] = useState<string[]>([]);
  const [currentGameEndDialogueIndex, setCurrentGameEndDialogueIndex] = useState(0);
  const [isGameEndTextComplete, setIsGameEndTextComplete] = useState(false);
  const gameEndDialogueIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gameEndDialogueTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [playerWon, setPlayerWon] = useState<boolean | null>(null);
  const [isGameEnding, setIsGameEnding] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  // Tomie Expression Popup State
  const [showTomieExpressionPopup, setShowTomieExpressionPopup] = useState(false);
  const [tomieExpressionFadingOut, setTomieExpressionFadingOut] = useState(false);
  const [tomieExpressionFace, setTomieExpressionFace] = useState<string>('');

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
    "Tomie: We'll play rock, paper, scissors. Simple enough, right?",
    "Tomie: But this isn't just any game... Let's see how deep your luck really goes."
  ];
  
  const choicePrompt = "What do you choose?";
  
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
    
    // Limpiar cualquier intervalo/timeout anterior
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Inicializar el texto vacío ANTES de cargar el audio para evitar parpadeos
    setDisplayText('');
    setIsTextComplete(false);
    const currentDialogue = introDialogues[currentDialogueIndex];
    // Reproducir audio de voz según el índice del diálogo
    const audioPath = currentDialogueIndex === 0 ? '/music/introDialogues_1.mp3' : '/music/introDialogues_2.mp3';
    const currentIndexRef = { value: 0 };
    let isAnimationRunning = false;
    let calculatedIntervalMs = 50; // Default
    
    const startTextAnimation = () => {
      if (isAnimationRunning) return;
      isAnimationRunning = true;
      
      // Limpiar intervalo anterior si existe
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
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
          isAnimationRunning = false;
          setIsTextComplete(true);
          // Calcular tiempo de espera basado en la duración del audio o velocidad usada
          const estimatedDuration = calculatedIntervalMs * currentDialogue.length;
          const waitTime = estimatedDuration > 0 ? estimatedDuration + 250 : 1000;
          
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
          }, waitTime);
        }
      }, calculatedIntervalMs);
    };
    
    // Iniciar la animación inmediatamente con velocidad default (esto asegura que el texto aparezca)
    startTextAnimation();
    
    // Ajustar velocidad cuando el audio cargue
    playVoice(audioPath).then((duration) => {
      if (duration > 0 && currentIndexRef.value < currentDialogue.length) {
        // Calcular velocidad de escritura basada en la duración del audio
        const charsPerSecond = currentDialogue.length / duration;
        const newIntervalMs = Math.max(30, Math.min(100, 1000 / charsPerSecond)); // Entre 30ms y 100ms
        
        // Solo actualizar si la velocidad es significativamente diferente (más de 10ms de diferencia)
        if (Math.abs(newIntervalMs - calculatedIntervalMs) > 10) {
          calculatedIntervalMs = newIntervalMs;
          
          // Si hay un intervalo corriendo, detenerlo y reiniciar con nueva velocidad
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            isAnimationRunning = false;
            // Reiniciar con la nueva velocidad (mantiene el progreso actual en currentIndexRef)
            startTextAnimation();
          }
        }
      }
    }).catch(err => {
      console.error('Error reproduciendo voz:', err);
      // Continuar con la velocidad default que ya está corriendo
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentDialogueIndex, gamePhase, playVoice]);

  const handleDialogueClick = () => {
    if (gamePhase === 'intro') {
      const currentDialogue = introDialogues[currentDialogueIndex];
      if (!isTextComplete) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        stopVoice(); // Detener el audio cuando se acelera el diálogo
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
        }, 1000);
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
      // Limpiar intervals y timeouts
      if (resultDialogueIntervalRef.current) clearInterval(resultDialogueIntervalRef.current);
      if (resultDialogueTimeoutRef.current) clearTimeout(resultDialogueTimeoutRef.current);
      stopVoice(); // Detener el audio cuando se acelera el diálogo
      setDisplayText(resultDialogues[currentResultDialogueIndex]);
      setIsResultTextComplete(true);
      resultDialogueTimeoutRef.current = setTimeout(() => {
        if (currentResultDialogueIndex < resultDialogues.length - 1) {
          setCurrentResultDialogueIndex(prev => prev + 1);
        } else {
          setCurrentResultDialogueIndex(prev => prev + 1);
        }
      }, 1000);
    } else if (isResultTextComplete) {
      if (resultDialogueTimeoutRef.current) clearTimeout(resultDialogueTimeoutRef.current);
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
      // Limpiar intervals y timeouts
      if (gameEndDialogueIntervalRef.current) clearInterval(gameEndDialogueIntervalRef.current);
      if (gameEndDialogueTimeoutRef.current) clearTimeout(gameEndDialogueTimeoutRef.current);
      stopVoice(); // Detener el audio cuando se acelera el diálogo
      setDisplayText(gameEndDialogues[currentGameEndDialogueIndex]);
      setIsGameEndTextComplete(true);
      gameEndDialogueTimeoutRef.current = setTimeout(() => {
        if (currentGameEndDialogueIndex < gameEndDialogues.length - 1) {
          setCurrentGameEndDialogueIndex(prev => prev + 1);
        } else {
          // Activar fade a negro antes de redirigir
          setIsFadingOut(true);
          setTimeout(() => {
            navigate(playerWon ? '/victory' : '/defeat');
          }, 2000);
        }
      }, 1000);
    } else if (isGameEndTextComplete) {
      if (gameEndDialogueTimeoutRef.current) clearTimeout(gameEndDialogueTimeoutRef.current);
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
          const won = gameEndEvent.data.player_won === true;
          setPlayerWon(gameEndEvent.data.player_won);
          setIsGameEnding(true);
          
          const endDialogues = won
          ? [ "Tomie: You've won... for now." ]
          : [ "Tomie: You've lost... just as I expected." ];
        
          setGameEndDialogues(endDialogues);
          
          // Guardar el audio de fin de juego para reproducirlo cuando se muestre el diálogo
          const gameEndAudio = won ? '/music/gameEndedPlayerWin.mp3' : '/music/gameEndedPlayerLose.mp3';
          (window as any).__currentGameEndAudio__ = gameEndAudio;
        }
        
        // Handle TomieExpressionEvent (face popup)
        const expressionEvent = result.parsed_events.find(
          (event) => event.key === 'TomieExpressionEvent'
        );
        
        if (expressionEvent && expressionEvent.data) {
          const expressionId = expressionEvent.data.expression_id;
          // expression_id 1 = face_3.png, expression_id 2 = face_4.png
          const faceImage = expressionId === 1 ? 'face_3.png' : 'face_4.png';
          setTomieExpressionFace(faceImage);
          setShowTomieExpressionPopup(true);
          setTomieExpressionFadingOut(false);
          
          // Auto-hide after 3 seconds with fade-out
          setTimeout(() => {
            setTomieExpressionFadingOut(true);
            setTimeout(() => {
              setShowTomieExpressionPopup(false);
              setTomieExpressionFace('');
            }, 500);
          }, 3000);
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

          const winner = resultEvent.data.result as 'DRAW' | 'PLAYER_WINS' | 'TOMIE_WINS';
          
          gameResult.current = {
            playerChoice: getChoiceNumber(resultEvent.data.player_choice),
            tomieChoice: getChoiceNumber(resultEvent.data.tomie_choice),
            winner: winner
          };
          
          // RESULT DIALOGUES
          const dialoguesByResult = {
            'DRAW': [
              "Tomie: A draw... How curious. It seems we're evenly cursed.",
            ],
            'PLAYER_WINS': [
              "Tomie: You won this round... but don't get too confident.",
              ],
            'TOMIE_WINS': [
              "Tomie: I win this round. You're starting to shake… how adorable.",
            ],
          };
          
          // Mapeo de audio para resultados
          const resultAudioMap = {
            'DRAW': '/music/draw.mp3',
            'PLAYER_WINS': '/music/playerWin.mp3',
            'TOMIE_WINS': '/music/tomieWin.mp3'
          };
          
          setResultDialogues(dialoguesByResult[winner]);
          // Guardar el audio path para reproducirlo cuando se muestre el diálogo
          (window as any).__currentResultAudio__ = resultAudioMap[winner];
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
          }, 3000); // Reducido porque ahora el audio se reproduce con el diálogo
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
    
    // Limpiar refs anteriores
    if (resultDialogueIntervalRef.current) clearInterval(resultDialogueIntervalRef.current);
    if (resultDialogueTimeoutRef.current) clearTimeout(resultDialogueTimeoutRef.current);
    
    // Obtener el audio correspondiente (solo para el primer diálogo)
    const audioPath = currentResultDialogueIndex === 0 && (window as any).__currentResultAudio__ 
      ? (window as any).__currentResultAudio__ 
      : null;
    
    // Si hay audio (solo para el primer diálogo de resultado), reproducirlo y sincronizar
    if (audioPath) {
      // Delay de 1 segundo para que termine la animación
      setTimeout(() => {
        playVoice(audioPath).then((duration) => {
          if (duration > 0) {
            const charsPerSecond = currentDialogue.length / duration;
            const intervalMs = Math.max(30, Math.min(100, 1000 / charsPerSecond));
            
            resultDialogueIntervalRef.current = setInterval(() => {
              if (currentIndex < currentDialogue.length) {
                setDisplayText(currentDialogue.slice(0, currentIndex + 1));
                currentIndex++;
              } else {
                if (resultDialogueIntervalRef.current) {
                  clearInterval(resultDialogueIntervalRef.current);
                  resultDialogueIntervalRef.current = null;
                }
                setIsResultTextComplete(true);
                resultDialogueTimeoutRef.current = setTimeout(() => {
                  if (currentResultDialogueIndex < resultDialogues.length - 1) {
                    setCurrentResultDialogueIndex(prev => prev + 1);
                  } else {
                    setCurrentResultDialogueIndex(prev => prev + 1);
                  }
                }, (duration * 1000) + 250);
              }
            }, intervalMs);
          } else {
            // Fallback
            resultDialogueIntervalRef.current = setInterval(() => {
              if (currentIndex < currentDialogue.length) {
                setDisplayText(currentDialogue.slice(0, currentIndex + 1));
                currentIndex++;
              } else {
                if (resultDialogueIntervalRef.current) {
                  clearInterval(resultDialogueIntervalRef.current);
                  resultDialogueIntervalRef.current = null;
                }
                setIsResultTextComplete(true);
                resultDialogueTimeoutRef.current = setTimeout(() => {
                  if (currentResultDialogueIndex < resultDialogues.length - 1) {
                    setCurrentResultDialogueIndex(prev => prev + 1);
                  } else {
                    setCurrentResultDialogueIndex(prev => prev + 1);
                  }
                }, 1000);
              }
            }, 50);
          }
        }).catch(err => {
          console.error('Error reproduciendo voz:', err);
          resultDialogueIntervalRef.current = setInterval(() => {
            if (currentIndex < currentDialogue.length) {
              setDisplayText(currentDialogue.slice(0, currentIndex + 1));
              currentIndex++;
            } else {
              if (resultDialogueIntervalRef.current) {
                clearInterval(resultDialogueIntervalRef.current);
                resultDialogueIntervalRef.current = null;
              }
              setIsResultTextComplete(true);
              resultDialogueTimeoutRef.current = setTimeout(() => {
                if (currentResultDialogueIndex < resultDialogues.length - 1) {
                  setCurrentResultDialogueIndex(prev => prev + 1);
                } else {
                  setCurrentResultDialogueIndex(prev => prev + 1);
                }
              }, 1000);
            }
          }, 50);
        });
      }, 1000);
    } else {
      // Si no hay audio, usar velocidad estándar
      resultDialogueIntervalRef.current = setInterval(() => {
        if (currentIndex < currentDialogue.length) {
          setDisplayText(currentDialogue.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          if (resultDialogueIntervalRef.current) {
            clearInterval(resultDialogueIntervalRef.current);
            resultDialogueIntervalRef.current = null;
          }
          setIsResultTextComplete(true);
          resultDialogueTimeoutRef.current = setTimeout(() => {
            if (currentResultDialogueIndex < resultDialogues.length - 1) {
              setCurrentResultDialogueIndex(prev => prev + 1);
            } else {
              setCurrentResultDialogueIndex(prev => prev + 1);
            }
          }, 2000);
        }
      }, 50);
    }

    return () => {
      if (resultDialogueIntervalRef.current) clearInterval(resultDialogueIntervalRef.current);
      if (resultDialogueTimeoutRef.current) clearTimeout(resultDialogueTimeoutRef.current);
    };
  }, [currentResultDialogueIndex, gamePhase, resultDialogues, isGameEnding, playVoice]);
  
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
    let interval: NodeJS.Timeout | null = null;
    
    // Obtener el audio de fin de juego (solo para el primer diálogo)
    const audioPath = currentGameEndDialogueIndex === 0 && (window as any).__currentGameEndAudio__ 
      ? (window as any).__currentGameEndAudio__ 
      : null;
    
    // Si hay audio, reproducirlo y sincronizar
    if (audioPath) {
      playVoice(audioPath).then((duration) => {
        if (duration > 0) {
          const charsPerSecond = currentDialogue.length / duration;
          const intervalMs = Math.max(30, Math.min(100, 1000 / charsPerSecond));
          
          interval = setInterval(() => {
            if (currentIndex < currentDialogue.length) {
              setDisplayText(currentDialogue.slice(0, currentIndex + 1));
              currentIndex++;
            } else {
              if (interval) clearInterval(interval);
              setIsGameEndTextComplete(true);
              timeoutId = setTimeout(() => {
                if (currentGameEndDialogueIndex < gameEndDialogues.length - 1) {
                  setCurrentGameEndDialogueIndex(prev => prev + 1);
                } else {
                  setIsFadingOut(true);
                  setTimeout(() => {
                    navigate(playerWon ? '/victory' : '/defeat');
                  }, 1000);
                }
              }, (duration * 1000) + 250);
            }
          }, intervalMs);
        } else {
          // Fallback
          interval = setInterval(() => {
            if (currentIndex < currentDialogue.length) {
              setDisplayText(currentDialogue.slice(0, currentIndex + 1));
              currentIndex++;
            } else {
              if (interval) clearInterval(interval);
              setIsGameEndTextComplete(true);
              timeoutId = setTimeout(() => {
                if (currentGameEndDialogueIndex < gameEndDialogues.length - 1) {
                  setCurrentGameEndDialogueIndex(prev => prev + 1);
                } else {
                  setIsFadingOut(true);
                  setTimeout(() => {
                    navigate(playerWon ? '/victory' : '/defeat');
                  }, 1000);
                }
              }, 1500);
            }
          }, 50);
        }
      }).catch(err => {
        console.error('Error reproduciendo voz:', err);
        interval = setInterval(() => {
          if (currentIndex < currentDialogue.length) {
            setDisplayText(currentDialogue.slice(0, currentIndex + 1));
            currentIndex++;
          } else {
            if (interval) clearInterval(interval);
            setIsGameEndTextComplete(true);
            timeoutId = setTimeout(() => {
              if (currentGameEndDialogueIndex < gameEndDialogues.length - 1) {
                setCurrentGameEndDialogueIndex(prev => prev + 1);
              } else {
                setIsFadingOut(true);
                setTimeout(() => {
                  navigate(playerWon ? '/victory' : '/defeat');
                }, 1000);
              }
            }, 3000);
          }
        }, 50);
      });
    } else {
      // Si no hay audio, usar velocidad estándar
      interval = setInterval(() => {
        if (currentIndex < currentDialogue.length) {
          setDisplayText(currentDialogue.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          if (interval) clearInterval(interval);
          setIsGameEndTextComplete(true);
          timeoutId = setTimeout(() => {
            if (currentGameEndDialogueIndex < gameEndDialogues.length - 1) {
              setCurrentGameEndDialogueIndex(prev => prev + 1);
            } else {
              setIsFadingOut(true);
              setTimeout(() => {
                navigate(playerWon ? '/victory' : '/defeat');
              }, 1000);
            }
          }, 3000);
        }
      }, 50);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentGameEndDialogueIndex, gamePhase, gameEndDialogues, playerWon, navigate, playVoice]);

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
      
      {gamePhase !== 'result-animation' && !showTomieExpressionPopup && (
        <div className={`table-face-popup ${isLoaded ? 'fade-in-delay' : ''}`}>
          <img src="/backgrounds/face_2.png" alt="Face" />
        </div>
      )}
      
      {showTomieExpressionPopup && (
        <div className={`face-popup ${tomieExpressionFadingOut ? 'fade-out-popup' : 'fade-in-popup'}`}>
          <img src={`/backgrounds/${tomieExpressionFace}`} alt="Tomie Expression" />
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
