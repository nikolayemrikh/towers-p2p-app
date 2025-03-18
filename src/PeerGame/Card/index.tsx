import { EPower } from '@app/core/game/enums';
import { Paper, Stack, Typography } from '@mui/material';
import { FC } from 'react';

const PowerTitle: Record<EPower, string> = {
  Move_down_by_two: 'Move down by two',
  Move_up_by_two: 'Move up by two',
  Protect: 'Protect',
  Remove_bottom: 'Remove bottom',
  Remove_middle: 'Remove middle',
  Remove_top: 'Remove top',
  Swap_neighbours: 'Swap neighbours',
  Swap_through_one: 'Swap through one',
};

export const Card: FC<{
  number: number;
  power: EPower;
  isActionAvailable: boolean;
  isProtected: boolean;
  onClick?: () => void;
}> = (props) => {
  const { number, power, isActionAvailable, isProtected, onClick } = props;
  return (
    <Paper
      onClick={() => onClick?.()}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 3,
        padding: 2,
        overflow: 'hidden',
        width: 230,
        height: 160,
      }}
      // style={{
      //   display: 'flex',
      //   'flexDirection': 'column',
      //   padding: '10px',
      //   border: isProtected ? '1px solid red' : 'none',
      //   'backgroundColor': isActionAvailable ? 'purple' : 'black',
      // }}
    >
      <Stack
        justifyContent="center"
        alignItems="center"
        sx={{
          width: 40,
          height: 40,
          clipPath: 'polygon(0 0, 5% 85%, 50% 100%, 95% 85%, 100% 0)',
          backgroundColor: 'grey',
        }}
      >
        <Typography
          variant="h4"
          color="white"
          sx={{
            WebkitTextStrokeColor: 'black',
            WebkitTextStrokeWidth: '0.5px',
          }}
        >
          {number}
        </Typography>
      </Stack>
      <Stack
        justifyContent="center"
        alignItems="center"
        sx={{
          width: 30,
          height: 70,
          clipPath:
            'polygon(2% 2%, 8% 31.3%, 2% 64.6%, 2% 98%, 27% 78%, 52% 98%, 77% 78%, 98% 98%, 98% 64.6%, 100% 31.3%, 94% 2%)',
          backgroundColor: 'orange',
        }}
      ></Stack>
      <Typography variant="body1" color="white">
        ({PowerTitle[power]})
      </Typography>
    </Paper>
  );
};
