import { IBoard } from '../../types';
import { createDeckFromDiscaredCards } from '../createDeckFromDiscaredCards';

export const removeCard = async (board: IBoard, cardIndex: number): Promise<void> => {
  for (const cardTower of Object.values(board.towers)) {
    let cardsInBoardDeck = board.closedCardNumbers;
    if (!cardsInBoardDeck.length) {
      await createDeckFromDiscaredCards(board);
      cardsInBoardDeck = board.closedCardNumbers;
    }
    const cardInBoardDeck = cardsInBoardDeck[cardsInBoardDeck.length - 1] as (typeof cardsInBoardDeck)[0] | undefined;

    if (!cardInBoardDeck) throw new Error('Deck should not be empty');

    const cardInTowerToUpdate = cardTower.cards[cardIndex];

    // update card in card tower
    cardInTowerToUpdate.number = cardInBoardDeck;
    cardInTowerToUpdate.isProtected = false;

    // move card from card tower to opened pile
    board.openedCardNumberToUse = cardInTowerToUpdate.number;

    // remove card from board deck
    cardsInBoardDeck.pop();
  }
};
