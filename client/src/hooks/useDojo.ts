import { useDojoSDK } from '@dojoengine/sdk/react';
import { useAccount } from '@starknet-react/core';

export const useDojo = () => {
  const { client } = useDojoSDK();
  const { account } = useAccount();

  return {
    client,
    account,
    account_address: account?.address || '',
  };
}; 