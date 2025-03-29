import { FC, useState } from 'react';

import { TUseSelectedCardParams } from '@app/core/game/actions/useSelectedCard/types';
import { checkIsUserCardAvailableForInitialAction } from '@app/core/game/common/checkIsUserCardAvailableForInitialAction';
import { CARD_VARIANTS } from '@app/core/game/constants';
import { EGameActionType, EPower } from '@app/core/game/enums';
import { ITowerCard, TGameAction } from '@app/core/game/types';
import { Stack, Typography, useMediaQuery } from '@mui/material';
import { Card } from '../Card';

export type TCardVariants = Map<number, EPower>;

export const UserTower: FC<{
  boardId: string;
  userId: string;
  turnUserId: string | null;
  cards: ITowerCard[];
  openedCardToUse: number | null;
  pulledCardToChange: number | null;
  isGameFinished: boolean;
  makeAction: (action: TGameAction) => void;
}> = (props) => {
  const { boardId, userId, turnUserId, cards, openedCardToUse, pulledCardToChange, isGameFinished, makeAction } = props;
  const [selectedCardIndexAccessor, setSelectedCardIndex] = useState<number | null>(null);

  // const changeCardToPulledMutation = useMutation({
  //   mutationFn: (index: number) =>
  //     supabase.functions.invoke('change-card-to-pulled', { body: { boardId: boardId, index } }),
  //   onSuccess: () =>
  //     queryClient.refetchQueries({ queryKey: [getGraphqlQueryKey(boardQueryDocument), boardId], exact: true }),
  // });

  const makeUseSelectedCardAction = (params: TUseSelectedCardParams) =>
    makeAction({ type: EGameActionType.UseCard, params });

  const handleCardClick = async (index: number, isActionAvailable: boolean): Promise<void> => {
    if (!isActionAvailable) return;
    if (pulledCardToChange) {
      makeAction({ type: EGameActionType.ChangeCardToPulled, params: { index, currentUsername: userId } });
      return;
    }
    if (!openedCardToUse) throw new Error('Can not make an action when there is no opened card to use');
    const selectedOpenedCardPower = CARD_VARIANTS.find((cardVariant) => cardVariant.number === openedCardToUse)!.power;
    const selectedCardIndex = selectedCardIndexAccessor;
    if (selectedCardIndex === null) {
      switch (selectedOpenedCardPower) {
        case EPower.Protect:
          return setSelectedCardIndex(index);
        case EPower.SwapNeighbours:
          return setSelectedCardIndex(index);
        case EPower.SwapThroughOne:
          return setSelectedCardIndex(index);
        case EPower.RemoveTop:
          return makeUseSelectedCardAction({ currentUsername: userId, boardId: boardId, power: EPower.RemoveTop });
        case EPower.RemoveMiddle:
          return makeUseSelectedCardAction({
            currentUsername: userId,
            boardId: boardId,
            power: EPower.RemoveMiddle,
          });
        case EPower.RemoveBottom:
          return makeUseSelectedCardAction({
            currentUsername: userId,
            boardId: boardId,
            power: EPower.RemoveBottom,
          });
        case EPower.MoveUpByTwo:
          return makeUseSelectedCardAction({
            currentUsername: userId,
            boardId: boardId,
            power: EPower.MoveUpByTwo,
            cardIndex: index,
          });
        case EPower.MoveDownByTwo:
          return makeUseSelectedCardAction({
            currentUsername: userId,
            boardId: boardId,
            power: EPower.MoveDownByTwo,
            cardIndex: index,
          });
        default: {
          const unhandledPower: never = selectedOpenedCardPower;
          throw new Error(`Unhandled power "${unhandledPower}"`);
        }
      }
    } else {
      try {
        switch (selectedOpenedCardPower) {
          case EPower.Protect:
            return makeUseSelectedCardAction({
              currentUsername: userId,
              boardId: boardId,
              power: EPower.Protect,
              fisrtCardIndex: selectedCardIndex,
              secondCardIndex: index,
            });
          case EPower.SwapNeighbours:
            return makeUseSelectedCardAction({
              currentUsername: userId,
              boardId: boardId,
              power: EPower.SwapNeighbours,
              fisrtCardIndex: selectedCardIndex,
              secondCardIndex: index,
            });
          case EPower.SwapThroughOne:
            return makeUseSelectedCardAction({
              currentUsername: userId,
              boardId: boardId,
              power: EPower.SwapThroughOne,
              fisrtCardIndex: selectedCardIndex,
              secondCardIndex: index,
            });
          default:
            throw new Error(`Only one card selection required to make action with power "${selectedOpenedCardPower}"`);
        }
      } finally {
        setSelectedCardIndex(null);
      }
    }
  };

  const checkIsAvailableForAction = (index: number, isProtected: boolean): boolean => {
    if (userId !== turnUserId) return false;
    if (pulledCardToChange) return true;
    if (!openedCardToUse) return false;
    if (isGameFinished) return false;

    const selectedOpenedCardPower = CARD_VARIANTS.find((cardVariant) => cardVariant.number === openedCardToUse)!.power;
    const selectedCardIndex = selectedCardIndexAccessor;
    if (selectedCardIndex === null) {
      return checkIsUserCardAvailableForInitialAction(index, isProtected, selectedOpenedCardPower, cards);
    } else {
      switch (selectedOpenedCardPower) {
        case 'Protect':
          return !isProtected && Math.abs(selectedCardIndex - index) === 1;
        case 'Swap_neighbours':
          return !isProtected && Math.abs(selectedCardIndex - index) === 1;
        case 'Swap_through_one':
          return !isProtected && Math.abs(selectedCardIndex - index) === 2;
        default:
          throw new Error(`Action for opened card power "${selectedOpenedCardPower}" can't have second step`);
      }
    }
  };

  const isLowerThanSmBreakpoint = useMediaQuery((t) => t.breakpoints.down('sm'));

  return (
    <Stack direction="column" gap={1} width={isLowerThanSmBreakpoint ? 120 : 230}>
      <Typography variant="h6">{userId} (me)</Typography>
      <Stack direction="column-reverse" gap={1}>
        {cards.map((card, index) => {
          const power = CARD_VARIANTS.find((cardVariant) => cardVariant.number === card.number)!.power;
          const isActionAvailable = checkIsAvailableForAction(index, card.isProtected);
          return (
            <Card
              key={card.number}
              number={card.number}
              power={power}
              width="100%"
              isActionAvailable={isActionAvailable}
              isProtected={card.isProtected}
              onClick={() => handleCardClick(index, isActionAvailable)}
            />
          );
        })}
      </Stack>
    </Stack>
  );
};
