import { TUseSelectedCardParams } from './actions/useSelectedCard/types';
import { EGameActionType, EPower } from './enums';

export interface ICardVariant {
  number: number;
  power: EPower;
}

export interface IGame {
  id: string;
  players: string[];
  createdAt: Date;
  board: IBoard;
}

export interface ICard {
  number: number;
  power: EPower;
}

export interface ITower {
  cards: ITowerCard[];
}

export interface ITowerCard {
  number: number;
  isProtected: boolean;
}

export interface IBoard {
  towers: Record<string, ITower>;
  openCardNumbers: number[];
  pulledCardNumberToChange: number | null;
  openedCardNumberToUse: number | null;
  closedCardNumbers: number[];
  discardedCardNumbers: number[];
  turnUsername: string;
}

export interface IGameBlockChain {
  initialBoard: IBoard;
  blocks: IStepBlock[];
}

export type TActionParams = {
  [EGameActionType.UseCard]: TUseSelectedCardParams;
};

export interface IGameAction<T extends EGameActionType> {
  type: T;
  params: TActionParams[T];
}

interface IStepBlock {
  username: string;
  actionParams: IGameAction<EGameActionType>;
}
