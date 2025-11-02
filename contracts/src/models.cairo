use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Game {
    #[key]
    pub id: u64,
    pub player: ContractAddress,
    pub in_progress: bool,
}
