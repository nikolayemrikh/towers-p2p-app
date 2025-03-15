import { IGame, IStepBlock } from '../game/types';
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
  data: IStepBlock;
}

export interface IAfterConnectionStartedCheckEventData {
  lastBlockHash: string | undefined;
}

export interface IAfterConnectionStartedCheckEvent extends IPeerBaseEvent {
  type: EPeerEventType.afterConnectionStartedCheck;
  data: IAfterConnectionStartedCheckEventData;
}

export type TPeerEvent = IInitializeGameEvent | IActionEvent | IAfterConnectionStartedCheckEvent | ICallRpcEvent;
