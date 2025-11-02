import { useState, useEffect, useCallback } from "react";
import { useDojoSDK } from "@dojoengine/sdk/react";
import type { Game } from "../dojo/generated/typescript/models.gen";
import { dojoConfig } from '../dojo/dojoConfig'

// Helper function to convert BigNumberish to number
const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10);
  if (typeof value === 'bigint') return Number(value);
  return 0;
};

export const useGameData = (gameId?: number) => {
  const { client } = useDojoSDK();
  
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGameData = useCallback(async () => {
    if (!gameId || !client) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const battleQuery = `
        query GetGame($gameId: Int!) {
          tobieGamesGameModels(where: { id: $gameId }) {
            edges {
              node {
                id
              }
            }
          }
        }
      `;
      
      const [gameResponse] = await Promise.all([
        fetch(`${dojoConfig.toriiUrl}/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: battleQuery,
            variables: { gameId }
          }),
        }),
      ]);
      
      if (!gameResponse.ok) {
        throw new Error(`HTTP error! status: ${gameResponse.status}`);
      }
      
      const [gameResult] = await Promise.all([
        gameResponse.json()
      ]);
      
      let gameData: Game | null = null;
      
      if (gameResult.errors) {
        throw new Error(`GraphQL game error: ${gameResult.errors[0]?.message || 'Unknown error'}`);
      }
      
      if (gameResult.data?.tobieGamesGameModels?.edges?.length > 0) {
        const gameNode = gameResult.data.tobieGamesGameModels.edges[0].node;
        
        gameData = {
          id: toNumber(gameNode.id),
        } as Game;
      } else {
        gameData = null;
      }
      
      setGame(gameData);
      } catch (err) {
        console.error("[useGameData] - Error loading game data:", err);
        setError(err instanceof Error ? err.message : "Error loading game data");
      } finally {
        setLoading(false);
      }
    }, [gameId, client]);

  useEffect(() => {
    if (gameId && client) {
      loadGameData();
    }
  }, [gameId, client, loadGameData]);

  return {
    game,
    loading,
    error,
    refetch: loadGameData,
  };
};
