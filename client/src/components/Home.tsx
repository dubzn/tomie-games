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
  connected = false
}) => {
  return (
    <div className="home">
      {/* Borde izquierdo - scroll de arriba hacia abajo */}
      <div className="scroll-edge scroll-edge-left">
        <div className="scroll-content scroll-content-left">
          <img src="/backgrounds/roll_1.png" alt="" />
          <img src="/backgrounds/roll_1.png" alt="" />
          <img src="/backgrounds/roll_1.png" alt="" />
          <img src="/backgrounds/roll_1.png" alt="" />
          <img src="/backgrounds/roll_1.png" alt="" />
          <img src="/backgrounds/roll_1.png" alt="" />
          <img src="/backgrounds/roll_1.png" alt="" />
          <img src="/backgrounds/roll_1.png" alt="" />
        </div>
      </div>

      {/* Borde derecho - scroll de abajo hacia arriba */}
      <div className="scroll-edge scroll-edge-right">
        <div className="scroll-content scroll-content-right">
          <img src="/backgrounds/roll_1.png" alt="" />
          <img src="/backgrounds/roll_1.png" alt="" />
          <img src="/backgrounds/roll_1.png" alt="" />
          <img src="/backgrounds/roll_1.png" alt="" />
          <img src="/backgrounds/roll_1.png" alt="" />
          <img src="/backgrounds/roll_1.png" alt="" />
          <img src="/backgrounds/roll_1.png" alt="" />
          <img src="/backgrounds/roll_1.png" alt="" />
        </div>
      </div>

      <h1 className="title-banner">
        <span className="titulo-text">Tomie Games</span>
      </h1>
      
      <div className="home-menu-container">
        {loading ? (
          <div className="menu-text"></div>
        ) : (
          <div className="menu-text" onClick={newGame}>
            {connected ? 'REDIRECTING..' : 'LOGIN WITH CONTROLLER'}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
