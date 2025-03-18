import { EPower } from '@app/core/game/enums';
import { Paper, Stack } from '@mui/material';
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
  width?: number;
}> = (props) => {
  const { number, power, isActionAvailable, isProtected, onClick, width } = props;
  return (
    <Paper
      onClick={() => onClick?.()}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8%',

        overflow: 'hidden',
        width: width ?? 230,
        aspectRatio: '1000/750',
      }}
      // style={{
      //   display: 'flex',
      //   'flexDirection': 'column',
      //   padding: '10px',
      //   border: isProtected ? '1px solid red' : 'none',
      //   'backgroundColor': isActionAvailable ? 'purple' : 'black',
      // }}
    >
      <Stack direction="column" flexGrow={1} justifyContent="center" alignItems="center" padding="12%">
        <Stack
          justifyContent="center"
          alignItems="center"
          sx={{
            width: '30%',
            aspectRatio: '1/1',
            clipPath: 'polygon(0 0, 5% 85%, 50% 100%, 95% 85%, 100% 0)',
            backgroundColor: 'grey',
            zIndex: 2,
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <text
              x="50"
              y="50"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="white"
              stroke="black"
              strokeWidth="0.5"
              style={{
                fontSize: '60',
                fontWeight: 'bold',
              }}
            >
              {number}
            </text>
          </svg>
        </Stack>
        <Stack
          justifyContent="center"
          alignItems="center"
          position="relative"
          top={'-6%'}
          sx={{
            aspectRatio: '1/1',
            width: '23%',
            height: '70%',
            clipPath:
              'polygon(2% 2%, 4% 31.3%, 2% 64.6%, 2% 98%, 27% 78%, 52% 98%, 77% 78%, 98% 98%, 98% 64.6%, 100% 31.3%, 98% 2%)',
            backgroundColor: '#e65100',
            zIndex: 1,
          }}
        >
          <Stack
            position="absolute"
            sx={{
              width: '100%',
              height: '100%',
              clipPath: 'polygon(8% 31.3%, 2% 64.6%, 98% 64.6%, 100% 31.3%)',
              backgroundColor: '#bf360c',
              opacity: 0.5,
            }}
          />
        </Stack>
        {/* <Typography
        variant="body1"
        color="white"
        sx={{
          fontSize: '90%',
          marginTop: '5%',
        }}
      >
        ({PowerTitle[power]})
      </Typography> */}
      </Stack>
    </Paper>
  );
};
