import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { BigNumberish } from 'starknet';

// Type definition for `tomie3::models::CurrentGame` struct
export interface CurrentGame {
	player_address: string;
	game_id: BigNumberish;
}

// Type definition for `tomie3::models::Game` struct
export interface Game {
	id: BigNumberish;
	player: string;
	lives: BigNumberish;
	tomie_lives: BigNumberish;
	current_minigame: BigNumberish;
	in_progress: boolean;
}

// Type definition for `tomie3::models::TotalGames` struct
export interface TotalGames {
	key: BigNumberish;
	total_games: BigNumberish;
}

// Type definition for `tomie3::models::DiceResultEvent` struct
export interface DiceResultEvent {
	game_id: BigNumberish;
	player_choice: BigNumberish;
	tomie_choice: BigNumberish;
	result: BigNumberish;
}

// Type definition for `tomie3::models::GameEndedEvent` struct
export interface GameEndedEvent {
	game_id: BigNumberish;
	player: string;
	player_won: boolean;
}

// Type definition for `tomie3::models::GameStartedEvent` struct
export interface GameStartedEvent {
	game_id: BigNumberish;
	player: string;
	lives: BigNumberish;
	tomie_lives: BigNumberish;
	current_minigame: BigNumberish;
}

// Type definition for `tomie3::models::TomieExpressionEvent` struct
export interface TomieExpressionEvent {
	game_id: BigNumberish;
	expression_id: BigNumberish;
}

// Type definition for `tomie3::models::YanKenPonResultEvent` struct
export interface YanKenPonResultEvent {
	game_id: BigNumberish;
	player_choice: BigNumberish;
	tomie_choice: BigNumberish;
	result: BigNumberish;
}

export interface SchemaType extends ISchemaType {
	tomie3: {
		CurrentGame: CurrentGame,
		Game: Game,
		TotalGames: TotalGames,
		DiceResultEvent: DiceResultEvent,
		GameEndedEvent: GameEndedEvent,
		GameStartedEvent: GameStartedEvent,
		TomieExpressionEvent: TomieExpressionEvent,
		YanKenPonResultEvent: YanKenPonResultEvent,
	},
}
export const schema: SchemaType = {
	tomie3: {
		CurrentGame: {
			player_address: "",
			game_id: 0,
		},
		Game: {
			id: 0,
			player: "",
			lives: 0,
			tomie_lives: 0,
			current_minigame: 0,
			in_progress: false,
		},
		TotalGames: {
			key: 0,
			total_games: 0,
		},
		DiceResultEvent: {
			game_id: 0,
			player_choice: 0,
			tomie_choice: 0,
			result: 0,
		},
		GameEndedEvent: {
			game_id: 0,
			player: "",
			player_won: false,
		},
		GameStartedEvent: {
			game_id: 0,
			player: "",
			lives: 0,
			tomie_lives: 0,
			current_minigame: 0,
		},
		TomieExpressionEvent: {
			game_id: 0,
			expression_id: 0,
		},
		YanKenPonResultEvent: {
			game_id: 0,
			player_choice: 0,
			tomie_choice: 0,
			result: 0,
		},
	},
};
export enum ModelsMapping {
	CurrentGame = 'tomie3-CurrentGame',
	Game = 'tomie3-Game',
	TotalGames = 'tomie3-TotalGames',
	DiceResultEvent = 'tomie3-DiceResultEvent',
	GameEndedEvent = 'tomie3-GameEndedEvent',
	GameStartedEvent = 'tomie3-GameStartedEvent',
	TomieExpressionEvent = 'tomie3-TomieExpressionEvent',
	YanKenPonResultEvent = 'tomie3-YanKenPonResultEvent',
}