import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { BigNumberish } from 'starknet';

// Type definition for `tobie_games::models::Game` struct
export interface Game {
	id: BigNumberish;
	player: string;
}

// Type definition for `tobie_games::random::Nonce` struct
export interface Nonce {
	key: BigNumberish;
	value: BigNumberish;
}

export interface SchemaType extends ISchemaType {
	tobie_games: {
		Game: Game,
		Nonce: Nonce,
	},
}
export const schema: SchemaType = {
	tobie_games: {
		Game: {
			id: 0,
			player: "",
		},
		Nonce: {
			key: 0,
			value: 0,
		},
	},
};
export enum ModelsMapping {
	Game = 'tobie_games-Game',
	Nonce = 'tobie_games-Nonce',
}