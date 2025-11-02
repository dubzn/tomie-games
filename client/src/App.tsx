import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAccount, useConnect } from '@starknet-react/core'
import './App.css'
import HomeScreen from './components/Home'
import GameScreen from './components/Game'
import { useActions } from './hooks/useActions'
import { AudioProvider } from './hooks/useAudio'

// Re-export useAudio hook for convenience
export { useAudio } from './hooks/useAudio'

// Componente para la pantalla de inicio - conecta wallet y navega a levels
function Home() {
  const navigate = useNavigate()
  const { account, address, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { newGame, loading: actionLoading, error: actionError } = useActions()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
 
  const isConnected = !!account && status === 'isConnected'

  useEffect(() => {
  }, [account, address, status, isisConnected, connectors.length])

  // Log y redirección cuando la wallet se conecta
  useEffect(() => {
    if (isisConnected && account && address) {
      navigate('/levels')
    }
  }, [isisConnected, account, address, status, navigate])

  // Combinar errores de acciones y locales
  const displayError = error || actionError

  const newGameCall = async () => {
    if (!isisConnected) {
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
      if (result) {
        navigate(`/game/${result}`)
      } else {
        throw new Error('Failed to create new game')
      }
      
    } catch (err) {
      console.error('❌ Error creating new game:', err)
      setError(err instanceof Error ? err.message : 'Failed to create new game')
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
      
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 9999
        }}>
          <div>Wallet: {isConnected ? '✅ isConnected' : '❌ Not isConnected'}</div>
          <div>Status: {status}</div>
          {isisConnected && connectors.length > 0 && (
            <div>Wallet Name: {connectors[0].name || connectors[0].id || 'Unknown'}</div>
          )}
          {address && !isConnected && (
            <div>Address: {address.slice(0, 6)}...{address.slice(-4)}</div>
          )}
        </div>
      )}
      
      <HomeScreen 
        newGame={newGameCall}
        loading={loading || actionLoading}
        isConnected={isConnected}
      />
    </>
  )
}

function App() {
  return (
    <AudioProvider>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:gameId" element={<GameScreen />} />
        </Routes>
      </div>
    </AudioProvider>
  )
}

export default App