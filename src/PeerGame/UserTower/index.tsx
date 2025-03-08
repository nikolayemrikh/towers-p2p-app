import { FC, useState } from 'react';

import { checkIsUserCardAvailableForInitialAction } from '@app/Board/helpers/checkIsUserCardAvailableForInitialAction';
import { TUseSelectedCardParams } from '@app/core/game/actions/useSelectedCard/types';
import { CARD_VARIANTS } from '@app/core/game/constants';
import { EGameActionType, EPower } from '@app/core/game/enums';
import { IGameAction, ITowerCard } from '@app/core/game/types';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../Card';

export type TCardVariants = Map<number, EPower>;

export const UserTower: FC<{
  boardId: string;
  userId: string;
  turnUserId: string | null;
  cards: ITowerCard[];
  openedCardToUse: number | null;
  pulledCardToChange: number | null;
  makeAction: (action: IGameAction<EGameActionType>) => void;
}> = (props) => {
  const { boardId, userId, turnUserId, cards, openedCardToUse, pulledCardToChange, makeAction } = props;
  const [selectedCardIndexAccessor, setSelectedCardIndex] = useState<number | null>(null);

  // const changeCardToPulledMutation = useMutation({
  //   mutationFn: (index: number) =>
  //     supabase.functions.invoke('change-card-to-pulled', { body: { boardId: boardId, index } }),
  //   onSuccess: () =>
  //     queryClient.refetchQueries({ queryKey: [getGraphqlQueryKey(boardQueryDocument), boardId], exact: true }),
  // });

  const useSelectedCardMutation = useMutation({
    mutationFn: async (params: TUseSelectedCardParams) => {
      return makeAction({ type: EGameActionType.UseCard, params });
    },
    // mutationFn: async (payload: TUseSelectedCardRequest) => {
    //   const token = (await supabase.auth.getSession()).data.session?.access_token;
    //   if (!token) throw new Error('No token');
    //   // biome-ignore lint/correctness/useHookAtTopLevel: not a react hook
    //   return rpc.authenticated.useSelectedCard(token, payload);
    // },
  });

  const handleCardClick = async (index: number, isActionAvailable: boolean): Promise<void> => {
    if (!isActionAvailable) return;
    if (pulledCardToChange) {
      // @TODO
      // changeCardToPulledMutation.mutate(index);
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
          return useSelectedCardMutation.mutate({ currentUsername: userId, boardId: boardId, power: EPower.RemoveTop });
        case EPower.RemoveMiddle:
          return useSelectedCardMutation.mutate({
            currentUsername: userId,
            boardId: boardId,
            power: EPower.RemoveMiddle,
          });
        case EPower.RemoveBottom:
          return useSelectedCardMutation.mutate({
            currentUsername: userId,
            boardId: boardId,
            power: EPower.RemoveBottom,
          });
        case EPower.MoveUpByTwo:
          return useSelectedCardMutation.mutate({
            currentUsername: userId,
            boardId: boardId,
            power: EPower.MoveUpByTwo,
            cardIndex: index,
          });
        case EPower.MoveDownByTwo:
          return useSelectedCardMutation.mutate({
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
            return useSelectedCardMutation.mutate({
              currentUsername: userId,
              boardId: boardId,
              power: EPower.Protect,
              fisrtCardIndex: selectedCardIndex,
              secondCardIndex: index,
            });
          case EPower.SwapNeighbours:
            return useSelectedCardMutation.mutate({
              currentUsername: userId,
              boardId: boardId,
              power: EPower.SwapNeighbours,
              fisrtCardIndex: selectedCardIndex,
              secondCardIndex: index,
            });
          case EPower.SwapThroughOne:
            return useSelectedCardMutation.mutate({
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
    if (useSelectedCardMutation.isPending) return false;
    if (userId !== turnUserId) return false;
    if (pulledCardToChange) return true;
    if (!openedCardToUse) return false;

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

  return (
    <div style={{ display: 'flex', 'flexDirection': 'column-reverse', gap: '8px' }}>
      {cards.map((card, index) => {
        const power = CARD_VARIANTS.find((cardVariant) => cardVariant.number === card.number)!.power;
        const isActionAvailable = checkIsAvailableForAction(index, card.isProtected);
        return (
          <Card
            key={card.number}
            number={card.number}
            power={power}
            isActionAvailable={isActionAvailable}
            isProtected={card.isProtected}
            onClick={() => handleCardClick(index, isActionAvailable)}
          />
        );
      })}
    </div>
  );
};
