import { useEffect, useRef } from 'react';
import { useAccount, useConnect } from '@starknet-react/core';

export const WalletSessionManager = () => {
  const { account, status, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const hasAttemptedRestore = useRef(false);

  useEffect(() => {
    if (hasAttemptedRestore.current) return;
    
    if (isConnected || status === 'connecting' || status === 'reconnecting') {
      return;
    }

    if (status === 'disconnected' && connectors.length > 0) {
      const connector = connectors[0];
      const restoreSession = async () => {
        try {
          hasAttemptedRestore.current = true;
          await connect({ connector });
        } catch (error) {
          hasAttemptedRestore.current = false;
        }
      };
      const timeoutId = setTimeout(restoreSession, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, status, connectors, connect]);

  useEffect(() => {
    if (isConnected) {
      hasAttemptedRestore.current = false;
    }
  }, [isConnected]);
  return null;
};
