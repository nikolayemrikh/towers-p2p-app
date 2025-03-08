import { FC } from 'react';

import { CARD_VARIANTS } from '@app/core/game/constants';
import { ITowerCard } from '@app/core/game/types';
import { Card } from '../Card';

export const Tower: FC<{ cards: ITowerCard[] }> = (props) => {
  const { cards } = props;
  return (
    <div style={{ display: 'flex', 'flexDirection': 'column-reverse', gap: '8px' }}>
      {cards.map((card) => {
        const power = CARD_VARIANTS.find((cardVariant) => cardVariant.number === card.number)!.power;
        return (
          <Card
            key={card.number}
            number={card.number}
            power={power}
            isActionAvailable={false}
            isProtected={card.isProtected}
          />
        );
      })}
    </div>
  );
};
