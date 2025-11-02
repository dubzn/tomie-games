#[starknet::interface]
pub trait IActions<T> {
    fn new_game(ref self: T);
    fn play(ref self: T, game_id: u32, choice: u8);
}

#[dojo::contract]
pub mod actions {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starknet::get_caller_address;
    use crate::models::*;
    use crate::random::{Random, RandomTrait};

    fn dojo_init(self: @ContractState) {}

    const TOTAL_GAMES_KEY: u32 = 1;
    const YANKENPON_ID: u8 = 1;
    const DICE_ID: u8 = 2;

    const DRAW: u8 = 0;
    const PLAYER_WINS: u8 = 1;
    const TOMIE_WINS: u8 = 2;

    #[abi(embed_v0)]
    impl ActionsImpl of super::IActions<ContractState> {
        fn new_game(ref self: ContractState) {
            let mut world = self.world_default();
            let total_games: TotalGames = world.read_model(TOTAL_GAMES_KEY);

            world
                .write_model(
                    @TotalGames { key: TOTAL_GAMES_KEY, total_games: total_games.total_games + 1 },
                );

            world
                .write_model(
                    @Game {
                        id: total_games.total_games + 1,
                        player: get_caller_address(),
                        lives: 3,
                        tomie_lives: 3,
                        current_minigame: YANKENPON_ID,
                        in_progress: true,
                    },
                );

            world.write_model(@CurrentGame { player_address: get_caller_address(), game_id: 0 });
        }

        fn play(ref self: ContractState, game_id: u32, choice: u8) {
            let mut world = self.world_default();
            let mut game: Game = world.read_model(game_id);
            let mut random = RandomTrait::new();

            if game.current_minigame == YANKENPON_ID {
                let (result, tomie_choice) = yankenpon(ref random, choice);
                if game.in_progress {
                    world
                        .emit_event(
                            @YanKenPonResult {
                                game_id: game_id,
                                player_choice: choice,
                                tomie_choice: tomie_choice,
                                result,
                            },
                        );

                    if result == PLAYER_WINS {
                        game.lives -= 1;
                        if random.between(0, 100) < 50 {
                            world.emit_event(@TomieExpression {
                                game_id: game_id,
                                expression_id: 2,
                            });
                        }
                    } else if result == TOMIE_WINS {
                        if random.between(0, 100) < 50 {
                            world.emit_event(@TomieExpression {
                                game_id: game_id,
                                expression_id: 1,
                            });
                        }
                        game.tomie_lives -= 1;
                    }

                    if game.lives == 0 {
                        game.in_progress = false;
                        world
                            .emit_event(
                                @GameEnded {
                                    game_id: game_id, player: game.player, player_won: false,
                                },
                            );
                    } else if game.tomie_lives == 0 {
                        game.in_progress = false;
                        world
                            .emit_event(
                                @GameEnded {
                                    game_id: game_id, player: game.player, player_won: true,
                                },
                            );
                    }
                }
            }

            world
                .write_model(
                    @Game {
                        id: game_id,
                        player: game.player,
                        lives: game.lives,
                        tomie_lives: game.tomie_lives,
                        current_minigame: game.current_minigame,
                        in_progress: game.in_progress,
                    },
                );
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"tomie1")
        }
    }

    // 1 rock
    // 2 paper
    // 3 scissors
    fn yankenpon(ref random: Random, choice: u8) -> (u8, u8) {
        let tomie_choice: i32 = random.between(1, 3);
        let i32_choice: i32 = choice.try_into().unwrap();

        let result = i32_choice - tomie_choice;
        if result == 0 {
            return (DRAW, tomie_choice.try_into().unwrap());
        } else if result == 1 || result == -2 {
            return (PLAYER_WINS, tomie_choice.try_into().unwrap());
        } else {
            return (TOMIE_WINS, tomie_choice.try_into().unwrap());
        }
    }
}

