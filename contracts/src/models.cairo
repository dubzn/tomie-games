use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct TotalGames {
    #[key]
    pub key: u32,
    pub total_games: u32,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Game {
    #[key]
    pub id: u32,
    pub player: ContractAddress,
    pub lives: u8,
    pub tomie_lives: u8,
    pub current_minigame: u8,
    pub in_progress: bool,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct CurrentGame {
    #[key]
    pub player_address: ContractAddress,
    pub game_id: u32,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::event]
pub struct TomieExpressionEvent {
    #[key]
    pub game_id: u32,
    pub expression_id: u32,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::event]
pub struct YanKenPonResultEvent {
    #[key]
    pub game_id: u32,
    pub player_choice: u8,
    pub tomie_choice: u8,
    pub result: u8,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::event]
pub struct DiceResultEvent {
    #[key]
    pub game_id: u32,
    pub player_choice: u8,
    pub tomie_choice: u8,
    pub result: u8,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::event]
pub struct GameStartedEvent {
    #[key]
    pub game_id: u32,
    pub player: ContractAddress,
    pub lives: u8,
    pub tomie_lives: u8,
    pub current_minigame: u8,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::event]
pub struct GameEndedEvent {
    #[key]
    pub game_id: u32,
    pub player: ContractAddress,
    pub player_won: bool,
}
