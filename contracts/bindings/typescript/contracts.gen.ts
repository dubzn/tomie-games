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
				"tomie3",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_play_calldata = (gameId: BigNumberish, choice: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "play",
			calldata: [gameId, choice],
		};
	};

	const actions_play = async (snAccount: Account | AccountInterface, gameId: BigNumberish, choice: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_play_calldata(gameId, choice),
				"tomie3",
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