import { IPullCardParams } from './actions/pullCard/types';
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
export interface IBaseGameAction {
  type: EGameActionType;
}

export interface IUseCardActionParams extends IBaseGameAction {
  type: EGameActionType.UseCard;
  params: TUseSelectedCardParams;
}

export interface IInitializeGameActionParams extends IBaseGameAction {
  type: EGameActionType.InitializeGame;
  params: IGame;
}

export interface IPullCardActionParams extends IBaseGameAction {
  type: EGameActionType.PullCard;
  params: IPullCardParams;
}

export type TGameAction = IUseCardActionParams | IInitializeGameActionParams | IPullCardActionParams;

interface IStepBlock {
  username: string;
  actionParams: TGameAction;
}
