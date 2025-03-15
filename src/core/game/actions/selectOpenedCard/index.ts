import { IBoard } from '@app/core/game/types';
import { ISelectOpenedCardParams } from './types';

export const selectOpenedCard = async (params: ISelectOpenedCardParams, board: IBoard): Promise<void> => {
  const currentUsername = params.currentUsername;
  if (currentUsername !== board.turnUsername) throw new Error('Can not use card since it is not current user turn');

  if (board.pulledCardNumberToChange) throw new Error('Can not select opened card since card has already been pulled');
  if (board.openedCardNumberToUse) throw new Error('Can not select opened card since it has already been selected');

  const cardInBoardNumber = board.openCardNumbers.find((cardNumber) => cardNumber === params.cardNumber);
  if (cardInBoardNumber == null) throw new Error(`Card with number "${params.cardNumber}" not found in board`);

  board.openedCardNumberToUse = cardInBoardNumber;
};
