import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_actions_newGame_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "new_game",
			calldata: [],
		};
	};

	const actions_newGame = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_newGame_calldata(),
				"tomie1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_play_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "play",
			calldata: [],
		};
	};

	const actions_play = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_play_calldata(),
				"tomie1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		actions: {
			newGame: actions_newGame,
			buildNewGameCalldata: build_actions_newGame_calldata,
			play: actions_play,
			buildPlayCalldata: build_actions_play_calldata,
		},
	};
}