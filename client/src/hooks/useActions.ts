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

export const useActions = () => {
  const { account } = useAccount();
  const { client } = useDojoSDK();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const newGame = async (): Promise<string | null> => {
  if (!account) {
      setError("Connect with controller");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await client.actions.newGame(account);
      const transaction_hash = response?.transaction_hash ?? "";
      await account.waitForTransaction(transaction_hash, {
        retryInterval: 50,
      });
      
      return response?.transaction_hash ?? "";

    } catch (err) {
        console.error("[newGame] - Error executing actions.new_game(): ", err);
        setError("Failed to create new game: " + (err instanceof Error ? err.message : 'Unknown error'));
        return null;
      } finally {
        setLoading(false);
      }
    };

  const play = async (
    actions: Array<string>,
  ): Promise<{transaction_hash: string, parsed_events: { key: string, data: any }[]} | null> => {
    if (!account) {
      setError("No account connected");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await client.actions.play(account, actions);
      const transaction_hash = response?.transaction_hash ?? "";
      const tx = await account.waitForTransaction(transaction_hash, {
        retryInterval: 100,
      });

        const events = tx.events;
        const parsed_events: { key: string, data: any }[] = [];
        return { transaction_hash, parsed_events };
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
