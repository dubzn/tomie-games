#[starknet::interface]
pub trait IActions<T> {
    fn new_game(ref self: T);
    fn play(ref self: T);
}

#[dojo::contract]
pub mod actions {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starknet::{ContractAddress, get_caller_address};

    fn dojo_init(self: @ContractState) {}

    #[abi(embed_v0)]
    impl ActionsImpl of super::IActions<ContractState> {
        fn new_game(ref self: ContractState) {
            let mut world = self.world_default();
        }

        fn play(ref self: ContractState) {
            let mut world = self.world_default();
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"tomie1")
        }
    }
}

fn other() {}
