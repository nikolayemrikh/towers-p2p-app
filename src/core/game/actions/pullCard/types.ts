import { IBoard } from '../../types.ts';

export interface IPullCardParams extends IBoard {
  currentUsername: string;
}
