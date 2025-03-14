import { IBoard } from '../../types';

export const passTurnToNextUser = async (board: IBoard, currentUsername: string): Promise<void> => {
  // const { data: cardTowers, error: cardTowersError } = await supabaseServiceClient
  //   .from('card_tower')
  //   .select('*')
  //   .eq('board_id', boardId);
  // if (cardTowersError) throw new Error(cardTowersError.message);

  const players = Object.keys(board.towers);

  const currentPlayerIndex = players.findIndex((player) => player === currentUsername);

  const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

  board.turnUsername = players[nextPlayerIndex];
};
