import { FC } from 'react';

import { CARD_VARIANTS } from '@app/core/game/constants';
import { ITowerCard } from '@app/core/game/types';
import { Stack, Typography } from '@mui/material';
import { Card } from '../Card';

export const Tower: FC<{ cards: ITowerCard[]; userId: string }> = (props) => {
  const { cards, userId } = props;
  return (
    <Stack direction="column" gap={1}>
      <Stack direction="row" justifyContent="space-between"></Stack>
      <Typography variant="h6">{userId}</Typography>
      <Stack direction="column-reverse" gap={1}>
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
      </Stack>
    </Stack>
  );
};
