import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useState } from "react";
import type { BigNumberish } from "starknet";
import { getEventKey } from "../dojo/getEventKey";

const toNumber = (val: any) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'bigint') return Number(val);
  if (typeof val === 'string') {
    if (val.startsWith('0x') || val.startsWith('0X')) {
      return parseInt(val, 16);
    }
    return parseInt(val, 10);
  }
  try {
    return Number(val);
  } catch {
    return 0;
  }
};

const parseChoice = (choice: number) => {
  switch (choice) {
    case 1:
      return "ROCK";
    case 2:
      return "PAPER";
    case 3:
      return "SCISSORS";
    default:
      return "UNKNOWN";
  }
};

const parseResult = (result: number) => {
  switch (result) {
    case 0:
      return "DRAW";
    case 1:
      return "PLAYER_WINS";
    case 2:
      return "TOMIE_WINS";
    default:
      return "UNKNOWN";
  }
};

export const useActions = () => {
  const { account } = useAccount();
  const { client } = useDojoSDK();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const newGame = async (): Promise<{transaction_hash: string, game_id: BigNumberish} | null> => {
  if (!account) {
      setError("Connect with controller");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await client.actions.newGame(account);
      const transaction_hash = response?.transaction_hash ?? "";
      const tx = await account.waitForTransaction(transaction_hash, {
        retryInterval: 100,
      });

      if (tx.isSuccess()) {
        const events = tx.events;
        const gameCreated = events.find((event) => event.keys[1] === getEventKey("GameStartedEvent"));
        console.log("gameCreated", gameCreated);
        return {transaction_hash, game_id: toNumber(gameCreated?.data[1])};
      } else {
        throw new Error("Tx failed: " + (tx.isError() ? tx.value.message : 'Unknown error'));
      }
    } catch (err) {
        console.error("[newGame] - Error executing actions.new_game(): ", err);
        setError("Failed to create new game: " + (err instanceof Error ? err.message : 'Unknown error'));
        return null;
      } finally {
        setLoading(false);
      }
    };

  const play = async (
    gameId: BigNumberish,
    choice: number,
  ): Promise<{transaction_hash: string, parsed_events: { key: string, data: any }[]} | null> => {
    if (!account) {
      setError("No account connected");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await client.actions.play(account, gameId, choice);
      const transaction_hash = response?.transaction_hash ?? "";
      const tx = await account.waitForTransaction(transaction_hash, {
        retryInterval: 100,
      });

      if (tx.isSuccess()) {
        const events = tx.events;
        console.log("[PLAY] - Events: ", events);
        const parsed_events: { key: string, data: any }[] = [];
        for (const event of events) {
          if (event.keys[1] === getEventKey("YanKenPonResultEvent")) {
            let result = parseResult(toNumber(event.data[5]));
            parsed_events.push({ key: "YanKenPonResultEvent", data: { game_id: toNumber(event.data[1]), player_choice: parseChoice(toNumber(event.data[3])), tomie_choice: parseChoice(toNumber(event.data[4])), result: result } });
          } else if (event.keys[1] === getEventKey("TomieExpressionEvent")) {
            parsed_events.push({ key: "TomieExpressionEvent", data: { game_id: toNumber(event.data[1]), expression_id: toNumber(event.data[2]) } });
          } else if (event.keys[1] === getEventKey("GameEndedEvent")) {
            parsed_events.push({ key: "GameEndedEvent", data: { game_id: toNumber(event.data[1]), player: event.data[2], player_won: event.data[3] } });
          } else {}
        }
        return { transaction_hash, parsed_events };
      } else {
        throw new Error("Tx failed: " + (tx.isError() ? tx.value.message : 'Unknown error'));
      }
    } catch (err) {
      console.error("[play] - Error executing actions.play(): ", err);
      setError("Failed to play: " + (err instanceof Error ? err.message : 'Unknown error'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    newGame,
    play,

    loading,
    error,
    clearError: () => setError(null),
  };
}; 


