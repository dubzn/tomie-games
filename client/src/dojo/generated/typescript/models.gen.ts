import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { BigNumberish } from 'starknet';

// Type definition for `tomie1::models::Game` struct
export interface Game {
	id: BigNumberish;
	player: string;
	in_progress: boolean;
}

export interface SchemaType extends ISchemaType {
	tomie1: {
		Game: Game,
	},
}
export const schema: SchemaType = {
	tomie1: {
		Game: {
			id: 0,
			player: "",
			in_progress: false,
		},
	},
};
export enum ModelsMapping {
	Game = 'tomie1-Game',
}