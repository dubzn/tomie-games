import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAccount, useConnect } from '@starknet-react/core'
import './App.css'
import HomeScreen from './components/Home'
import GameScreen from './components/Game'
import TableScreen from './components/Table'
import DefeatScreen from './components/Defeat'
import VictoryScreen from './components/Victory'
import { useActions } from './hooks/useActions'
import { AudioProvider } from './hooks/useAudio'
import { useBackgroundMusic } from './hooks/useBackgroundMusic'
export { useAudio } from './hooks/useAudio'

function Home() {
  const navigate = useNavigate()
  const { account, address, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { newGame, loading: actionLoading, error: actionError } = useActions()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFadingOut, setIsFadingOut] = useState(false)
 
  const connected = !!account && status === 'connected'

  useEffect(() => {
    if (connected && account && address) {
      // Activar fade a negro antes de navegar
      setIsFadingOut(true)
      const timer = setTimeout(() => {
        navigate('/game')
      }, 2000) // Tiempo para el fade a negro
      return () => clearTimeout(timer)
    }
  }, [connected, account, address, status, navigate])

  // Combinar errores de acciones y locales
  const displayError = error || actionError

  const newGameCall = async () => {
    if (!connected) {
      if (connectors.length > 0) {
        try {
          setLoading(true)
          setError(null)
          await connect({ connector: connectors[0] })
        } catch (err) {
          setError('Error connecting wallet: ' + (err instanceof Error ? err.message : 'Unknown error'))
        } finally {
          setLoading(false)
        }
      }
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const result = await newGame()
      if (result && result.game_id) {
        const gameId = typeof result.game_id === 'bigint' ? result.game_id.toString() : String(result.game_id)
        // Activar fade a negro antes de navegar
        setIsFadingOut(true)
        setTimeout(() => {
          navigate(`/game/${gameId}`)
        }, 2000) // Tiempo para el fade a negro
      } else {
        throw new Error('Failed to create new game')
      }
      
    } catch (err) {
      console.error('Error creating new game:', err)
      setError(err instanceof Error ? err.message : 'Failed to create new game')
      setIsFadingOut(false) // Cancelar fade si hay error
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {displayError && (
        <div className="error-message">
          {displayError}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <HomeScreen 
        newGame={newGameCall}
        loading={loading || actionLoading}
        connected={connected}
      />
      
      {/* Fade a negro */}
      <div className={`fade-to-black ${isFadingOut ? 'fade-out-active' : ''}`}></div>
    </>
  )
}

function App() {
  useBackgroundMusic();
  
  return (
    <AudioProvider>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<GameScreen />} />
          <Route path="/game/:gameId" element={<TableScreen />} />
          <Route path="/defeat" element={<DefeatScreen />} />
          <Route path="/victory" element={<VictoryScreen />} />
        </Routes>
      </div>
    </AudioProvider>
  )
}

export default App