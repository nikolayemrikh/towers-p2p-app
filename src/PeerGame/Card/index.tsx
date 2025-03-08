import { EPower } from '@app/core/game/enums';
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
    <div
      onClick={() => onClick?.()}
      style={{
        display: 'flex',
        'flexDirection': 'column',
        padding: '10px',
        border: isProtected ? '1px solid red' : 'none',
        'backgroundColor': isActionAvailable ? 'purple' : 'black',
      }}
    >
      <div>card {number}</div>
      <div>({PowerTitle[power]})</div>
    </div>
  );
};
