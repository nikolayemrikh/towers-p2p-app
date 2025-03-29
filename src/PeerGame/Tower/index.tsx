import { FC } from 'react';

import { CARD_VARIANTS } from '@app/core/game/constants';
import { ITowerCard } from '@app/core/game/types';
import { Stack, Typography, useMediaQuery } from '@mui/material';
import { Card } from '../Card';

export const Tower: FC<{ cards: ITowerCard[]; userId: string }> = (props) => {
  const { cards, userId } = props;

  const isLowerThanSmBreakpoint = useMediaQuery((t) => t.breakpoints.down('sm'));
  return (
    <Stack direction="column" gap={1} width={isLowerThanSmBreakpoint ? 120 : 230}>
      <Stack direction="row" justifyContent="space-between"></Stack>
      <Typography variant="h6">{userId}</Typography>
      <Stack direction="column-reverse" gap={1}>
        {cards.map((card) => {
          const power = CARD_VARIANTS.find((cardVariant) => cardVariant.number === card.number)!.power;
          return (
            <Card
              width="100%"
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
