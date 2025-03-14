import { changeCardToPulled } from '../actions/changeCardToPulled';
import { pullCard } from '../actions/pullCard';
import { useSelectedCard } from '../actions/useSelectedCard';
import { EGameActionType } from '../enums';
import { TGameAction } from '../types';

import { IBoard } from '../types';

export const applyAction = (board: IBoard, action: TGameAction): void => {
  switch (action.type) {
    case EGameActionType.UseCard: {
      // biome-ignore lint/correctness/useHookAtTopLevel: <explanation>
      useSelectedCard(action.params, board);
      break;
    }
    case EGameActionType.PullCard: {
      pullCard(action.params, board);
      break;
    }
    case EGameActionType.ChangeCardToPulled: {
      changeCardToPulled(action.params, board);
      break;
    }
  }
};
