import { IBoard } from '../../types';

export const passTurnToNextUser = async (board: IBoard, currentUsername: string): Promise<void> => {
  // const { data: cardTowers, error: cardTowersError } = await supabaseServiceClient
  //   .from('card_tower')
  //   .select('*')
  //   .eq('board_id', boardId);
  // if (cardTowersError) throw new Error(cardTowersError.message);

  const nextUserCardTower =
    Object.entries(board.towers).find(([username, tower]) => username !== currentUsername && tower.cards.length > 0) ??
    Object.entries(board.towers)[0];

  board.turnUsername = nextUserCardTower[0];
};
