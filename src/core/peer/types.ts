import { IGame, TGameAction } from '../game/types';
import { EPeerEventType } from './enums';

export interface IPeerBaseEvent {
  type: EPeerEventType;
  data: unknown;
}

export interface IInitializeGameEvent extends IPeerBaseEvent {
  type: EPeerEventType.initializeGame;
  data: IGame;
}

export interface IActionEvent extends IPeerBaseEvent {
  type: EPeerEventType.action;
  data: TGameAction;
}

export type TPeerEvent = IInitializeGameEvent | IActionEvent;
