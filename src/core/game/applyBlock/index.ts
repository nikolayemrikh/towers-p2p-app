import { applyAction } from '../applyAction';
import { IBoard, IGameBlockChain, IStepBlock } from '../types';

export const applyBlock = (gameBlockchain: IGameBlockChain, board: IBoard, block: IStepBlock): void => {
  const previousBlock = gameBlockchain.blocks[gameBlockchain.blocks.length - 1];
  if (block?.previousHash !== previousBlock.hash) {
    throw new Error('Invalid block');
  }
  applyAction(board, block.action);
};
