import { type PropsWithChildren } from "react";
import type { Chain } from "@starknet-react/chains";
import { Connector, jsonRpcProvider, StarknetConfig, voyager } from "@starknet-react/core";
import { ControllerConnector } from "@cartridge/connector";
import { num, shortString } from "starknet";
import { getContractByName } from "@dojoengine/core";
import { dojoConfig } from "../dojo/dojoConfig";
import { SessionPolicies } from "@cartridge/presets";
import { WalletSessionManager } from "../components/WalletSessionManager";

const actions_contract = getContractByName(
  dojoConfig.manifest,
  dojoConfig.manifest.world.name,
  "actions"
);

const policies: SessionPolicies = {
  contracts: {
    [actions_contract.address]: {
      methods: [
        {
          name: "new_game",
          entrypoint: "new_game",
          description: "Start a new game",
        },
        { 
          name: "play",   
          entrypoint: "play",
          description: "Play a turn in the game"
        },
      ],
    },
  },
};

const controller = new ControllerConnector({
  chains: [
    {
      rpcUrl: dojoConfig.rpcUrl,
    },
  ],
  defaultChainId: shortString.encodeShortString("WP_TOMIE_GAMES"),
  policies,
});

const slot: Chain = {
  id: num.toBigInt(shortString.encodeShortString("WP_TOMIE_GAMES")),
  name: "Tomie Games",
  network: "tomie-games",
  rpcUrls: {
    default: {  
      http: [dojoConfig.rpcUrl],
    },
    public: {
      http: [dojoConfig.rpcUrl],
    },
  },  
  nativeCurrency: {
    name: "Starknet",
    symbol: "STRK",
    decimals: 18,
    address: "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D",
  },
  paymasterRpcUrls: {
    avnu: {
       http: ["http://localhost:5050"],
    },
  },
}

const provider = jsonRpcProvider({
  rpc: () => ({ nodeUrl: dojoConfig.rpcUrl }),
});

export default function StarknetProvider({ children }: PropsWithChildren) {

  return (
    <StarknetConfig
      chains={[slot]}
      provider={provider}
      connectors={[controller as unknown as Connector]}
      explorer={voyager}
      autoConnect
    >
      <WalletSessionManager />
      {children}
    </StarknetConfig>
  );
} 