import React from 'react';
import '../assets/font.css';

interface HomeScreenProps {
  newGame: () => void;
  loading?: boolean;
  connected?: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ 
  newGame, 
  loading = false,
  isConnected = false
}) => {
  return (
    <div className="home">
      
      <h1 className="title-banner">
        <span className="titulo-text">Tobie Games</span>
      </h1>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '24px'
      }}>
        {loading ? (
          <div className="press-start"></div>
        ) : (
          <div className="press-start" onClick={newGame}>
            {isConnected ? 'PRESS START' : 'CONNECT BY CONTROLLER'}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
