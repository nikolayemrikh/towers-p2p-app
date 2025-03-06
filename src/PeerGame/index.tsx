import {} from '@tanstack/react-query';
import { FC, useEffect, useMemo, useState } from 'react';

import { PageMain } from '@app/components/PageMain';
import { Button, Stack, Typography } from '@mui/material';
import { Peer } from 'peerjs';
import { useNavigate, useParams } from 'react-router-dom';

export enum EPower {
  MoveDownByTwo = 'Move_down_by_two',
  MoveUpByTwo = 'Move_up_by_two',
  Protect = 'Protect',
  RemoveBottom = 'Remove_bottom',
  RemoveMiddle = 'Remove_middle',
  RemoveTop = 'Remove_top',
  SwapNeighbours = 'Swap_neighbours',
  SwapThroughOne = 'Swap_through_one',
}

// INSERT INTO "public"."card_variant" ("number", "power") VALUES
// 	(1, 'Move_up_by_two'),
// 	(2, 'Remove_top'),
// 	(68, 'Move_down_by_two'),
// 	(47, 'Move_up_by_two'),
// 	(17, 'Swap_through_one'),
// 	(66, 'Move_up_by_two'),
// 	(41, 'Remove_bottom'),
// 	(13, 'Remove_bottom'),
// 	(29, 'Move_up_by_two'),
// 	(74, 'Remove_middle'),
// 	(52, 'Swap_neighbours'),
// 	(14, 'Protect'),
// 	(46, 'Remove_middle'),
// 	(83, 'Remove_bottom'),
// 	(57, 'Move_up_by_two'),
// 	(42, 'Protect'),
// 	(48, 'Remove_bottom'),
// 	(37, 'Remove_top'),
// 	(58, 'Remove_top'),
// 	(71, 'Swap_neighbours'),
// 	(43, 'Swap_neighbours'),
// 	(39, 'Remove_middle'),
// 	(60, 'Remove_middle'),
// 	(24, 'Swap_neighbours'),
// 	(12, 'Move_down_by_two'),
// 	(32, 'Remove_middle'),
// 	(59, 'Move_down_by_two'),
// 	(79, 'Remove_top'),
// 	(19, 'Move_up_by_two'),
// 	(25, 'Remove_middle'),
// 	(82, 'Swap_through_one'),
// 	(55, 'Remove_bottom'),
// 	(33, 'Swap_neighbours'),
// 	(67, 'Remove_middle'),
// 	(5, 'Swap_neighbours'),
// 	(75, 'Move_up_by_two'),
// 	(54, 'Swap_through_one'),
// 	(23, 'Remove_top'),
// 	(22, 'Move_down_by_two'),
// 	(44, 'Remove_top'),
// 	(16, 'Remove_top'),
// 	(50, 'Move_down_by_two'),
// 	(21, 'Protect'),
// 	(49, 'Protect'),
// 	(76, 'Remove_bottom'),
// 	(8, 'Swap_through_one'),
// 	(31, 'Move_down_by_two'),
// 	(35, 'Protect'),
// 	(9, 'Remove_top'),
// 	(15, 'Swap_neighbours'),
// 	(30, 'Remove_top'),
// 	(61, 'Swap_neighbours'),
// 	(53, 'Remove_middle'),
// 	(63, 'Protect'),
// 	(6, 'Remove_bottom'),
// 	(80, 'Swap_neighbours'),
// 	(72, 'Remove_top'),
// 	(7, 'Protect'),
// 	(84, 'Protect'),
// 	(26, 'Swap_through_one'),
// 	(77, 'Protect'),
// 	(70, 'Protect'),
// 	(51, 'Remove_top'),
// 	(3, 'Move_down_by_two'),
// 	(81, 'Remove_middle'),
// 	(11, 'Remove_middle'),
// 	(18, 'Remove_middle'),
// 	(64, 'Swap_through_one'),
// 	(65, 'Remove_top'),
// 	(4, 'Remove_middle'),
// 	(69, 'Remove_bottom'),
// 	(20, 'Remove_bottom'),
// 	(10, 'Move_up_by_two'),
// 	(62, 'Remove_bottom'),
// 	(40, 'Move_down_by_two'),
// 	(38, 'Move_up_by_two'),
// 	(28, 'Protect'),
// 	(78, 'Move_down_by_two'),
// 	(27, 'Remove_bottom'),
// 	(34, 'Remove_bottom'),
// 	(36, 'Swap_through_one'),
// 	(45, 'Swap_through_one'),
// 	(56, 'Protect'),
// 	(73, 'Swap_through_one');

const CARD_VARIANTS: ICardVariant[] = [
  { number: 1, power: EPower.MoveUpByTwo },
  { number: 2, power: EPower.RemoveTop },
  { number: 68, power: EPower.MoveDownByTwo },
  { number: 47, power: EPower.MoveUpByTwo },
  { number: 17, power: EPower.SwapThroughOne },
  { number: 66, power: EPower.MoveUpByTwo },
  { number: 41, power: EPower.RemoveBottom },
  { number: 13, power: EPower.RemoveBottom },
  { number: 29, power: EPower.MoveUpByTwo },
  { number: 74, power: EPower.RemoveMiddle },
  { number: 52, power: EPower.SwapNeighbours },
  { number: 14, power: EPower.Protect },
  { number: 46, power: EPower.RemoveMiddle },
  { number: 83, power: EPower.RemoveBottom },
  { number: 57, power: EPower.MoveUpByTwo },
  { number: 42, power: EPower.Protect },
  { number: 48, power: EPower.RemoveBottom },
  { number: 37, power: EPower.RemoveTop },
  { number: 58, power: EPower.RemoveTop },
  { number: 71, power: EPower.SwapNeighbours },
  { number: 43, power: EPower.SwapNeighbours },
  { number: 39, power: EPower.RemoveMiddle },
  { number: 60, power: EPower.RemoveMiddle },
  { number: 24, power: EPower.SwapNeighbours },
  { number: 12, power: EPower.MoveDownByTwo },
  { number: 32, power: EPower.RemoveMiddle },
  { number: 59, power: EPower.MoveDownByTwo },
  { number: 79, power: EPower.RemoveTop },
  { number: 19, power: EPower.MoveUpByTwo },
  { number: 25, power: EPower.RemoveMiddle },
  { number: 82, power: EPower.SwapThroughOne },
  { number: 55, power: EPower.RemoveBottom },
  { number: 33, power: EPower.SwapNeighbours },
  { number: 67, power: EPower.RemoveMiddle },
  { number: 5, power: EPower.SwapNeighbours },
  { number: 75, power: EPower.MoveUpByTwo },
  { number: 54, power: EPower.SwapThroughOne },
  { number: 23, power: EPower.RemoveTop },
  { number: 22, power: EPower.MoveDownByTwo },
  { number: 44, power: EPower.RemoveTop },
  { number: 16, power: EPower.RemoveTop },
  { number: 50, power: EPower.MoveDownByTwo },
  { number: 21, power: EPower.Protect },
  { number: 49, power: EPower.Protect },
  { number: 76, power: EPower.RemoveBottom },
  { number: 8, power: EPower.SwapThroughOne },
  { number: 31, power: EPower.MoveDownByTwo },
  { number: 35, power: EPower.Protect },
  { number: 9, power: EPower.RemoveTop },
  { number: 15, power: EPower.SwapNeighbours },
  { number: 30, power: EPower.RemoveTop },
  { number: 61, power: EPower.SwapNeighbours },
  { number: 53, power: EPower.RemoveMiddle },
  { number: 63, power: EPower.Protect },
  { number: 6, power: EPower.RemoveBottom },
  { number: 80, power: EPower.SwapNeighbours },
  { number: 72, power: EPower.RemoveTop },
  { number: 7, power: EPower.Protect },
  { number: 84, power: EPower.Protect },
  { number: 26, power: EPower.SwapThroughOne },
  { number: 77, power: EPower.Protect },
  { number: 70, power: EPower.Protect },
  { number: 51, power: EPower.RemoveTop },
  { number: 3, power: EPower.MoveDownByTwo },
  { number: 81, power: EPower.RemoveMiddle },
  { number: 11, power: EPower.RemoveMiddle },
  { number: 18, power: EPower.RemoveMiddle },
  { number: 64, power: EPower.SwapThroughOne },
  { number: 65, power: EPower.RemoveTop },
  { number: 4, power: EPower.RemoveMiddle },
  { number: 69, power: EPower.RemoveBottom },
  { number: 20, power: EPower.RemoveBottom },
  { number: 10, power: EPower.MoveUpByTwo },
  { number: 62, power: EPower.RemoveBottom },
  { number: 40, power: EPower.MoveDownByTwo },
  { number: 38, power: EPower.MoveUpByTwo },
  { number: 28, power: EPower.Protect },
  { number: 78, power: EPower.MoveDownByTwo },
  { number: 27, power: EPower.RemoveBottom },
  { number: 34, power: EPower.RemoveBottom },
  { number: 36, power: EPower.SwapThroughOne },
  { number: 45, power: EPower.SwapThroughOne },
  { number: 56, power: EPower.Protect },
  { number: 73, power: EPower.SwapThroughOne },
];

interface ICardVariant {
  number: number;
  power: EPower;
}

interface IGame {
  id: string;
  players: string[];
  createdAt: Date;
  opponentPublicKey: string;
}

export interface ICard {
  number: number;
  power: EPower;
}

export interface ITower {
  cards: ITowerCard[];
}

export interface ITowerCard {
  number: number;
  isProtected: boolean;
}

export interface IBoard {
  towers: Record<string, ITower>;
  openCardNumbers: number[];
  pulledCardNumberToChange: number | null;
  openedCardNumberToUse: number | null;
  closedCardNumbers: number[];
  discardedCardNumbers: number[];
  turnUsername: string;
}

export interface IGameBlockChain {
  initialBoard: IBoard;
  blocks: IStepBlock[];
  latestHash: string;
}

interface IStepBlock {
  createdAt: string;
  turnUsername: string;
  prevBlockHash: string;
  hash: string;
  action: IGameAction;
  signature: string;
  publicKey: string;
}

export interface IGameAction {
  type: 'PULL_CARD' | 'PLAY_CARD' | 'DISCARD_CARD';
  payload: {
    cardNumber?: number;
    targetTower?: string;
    targetPosition?: number;
    [key: string]: any;
  };
}

const signData = async (privateKey: CryptoKey, data: object) => {
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    privateKey,
    encoder.encode(JSON.stringify(data))
  );
  const signatureArray = new Uint8Array(signature);

  return signatureArray;
};

const verifyData = async (publicKey: CryptoKey, data: object, signature: Uint8Array) => {
  const encoder = new TextEncoder();
  const isValid = await crypto.subtle.verify(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    publicKey,
    signature,
    encoder.encode(JSON.stringify(data))
  );

  return isValid;
};

export const initializeGameState = (game: IGame): IBoard => {
  const cardVariantsToReduce = [...CARD_VARIANTS];
  const cardsInBoardDeck: ICardVariant[] = [];

  while (cardVariantsToReduce.length > 0) {
    const randomIndex = Math.floor(Math.random() * cardVariantsToReduce.length);
    const randomCardVariant = cardVariantsToReduce[randomIndex];
    cardsInBoardDeck.push(randomCardVariant);
    cardVariantsToReduce.splice(randomIndex, 1);
  }

  const cardTowers: Record<string, ITower> = {};

  for (const player of game.players) {
    const newCardTower: ITowerCard[] = [];
    for (let i = 0; i < 7; i++) {
      newCardTower.push({ number: cardsInBoardDeck.shift()!.number, isProtected: false });
    }
    cardTowers[player] = { cards: newCardTower };
  }

  // create cards in border deck
  const cardsInBorderDeck: ICard[] = [];
  for (let i = 0; i < 10; i++) {
    cardsInBorderDeck.push(cardsInBoardDeck.shift()!);
  }

  return {
    towers: cardTowers,
    pulledCardNumberToChange: null,
    openedCardNumberToUse: null,
    openCardNumbers: [],
    closedCardNumbers: cardsInBoardDeck.map((card) => card.number),
    discardedCardNumbers: [],
    turnUsername: game.players[0],
  };
};

const PEER_PREFIX = 'magic-towers';

const PEER_ID_SEPARATOR = '-';

const applyGameState = (gameState: IBoard, prevBlock: IStepBlock | null, stepBlock: IStepBlock): IBoard => {
  if (prevBlock && stepBlock.prevBlockHash !== prevBlock.hash) {
    throw new Error('prevBlockHash is invalid');
  }

  // Проверяем подпись действия
  const isValid = verifyBlockSignature(stepBlock);
  if (!isValid) {
    throw new Error('Block signature is invalid');
  }

  // Применяем действие к текущему состоянию
  return applyAction(gameState, stepBlock.action);
};

// Проверяем подпись блока
const verifyBlockSignature = async (block: IStepBlock): Promise<boolean> => {
  try {
    const publicKey = await importPublicKey(block.publicKey);
    const signature = new Uint8Array(
      atob(block.signature)
        .split('')
        .map((c) => c.charCodeAt(0))
    );

    return await verifyData(publicKey, block.action, signature);
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

// Импортируем публичный ключ из base64
const importPublicKey = async (base64Key: string): Promise<CryptoKey> => {
  const binaryKey = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey('spki', binaryKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
};

// Экспортируем публичный ключ в base64
const exportPublicKey = async (publicKey: CryptoKey): Promise<string> => {
  const exported = await crypto.subtle.exportKey('spki', publicKey);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

// Применяем действие к игровому состоянию
const applyAction = (gameState: IBoard, action: IGameAction): IBoard => {
  // Создаем глубокую копию состояния для изменений
  const newState = JSON.parse(JSON.stringify(gameState)) as IBoard;

  switch (action.type) {
    case 'PULL_CARD':
      // Логика вытягивания карты
      if (newState.closedCardNumbers.length > 0) {
        const randomIndex = Math.floor(Math.random() * newState.closedCardNumbers.length);
        const pulledCard = newState.closedCardNumbers[randomIndex];
        newState.closedCardNumbers.splice(randomIndex, 1);
        newState.pulledCardNumberToChange = pulledCard;
      }
      break;

    case 'PLAY_CARD':
      // Логика использования карты
      if (action.payload.cardNumber && action.payload.targetTower) {
        // Находим карту и применяем её силу к башне
        const cardPower = CARD_VARIANTS.find((card) => card.number === action.payload.cardNumber)?.power;

        if (cardPower) {
          // Применяем силу карты к башне
          // Здесь должна быть логика применения конкретной силы
        }

        // Перемещаем карту в сброс
        newState.discardedCardNumbers.push(action.payload.cardNumber);
      }
      break;

    case 'DISCARD_CARD':
      // Логика сброса карты
      if (action.payload.cardNumber) {
        newState.discardedCardNumbers.push(action.payload.cardNumber);
      }
      break;
  }

  // Переход хода к другому игроку
  const currentPlayerIndex = newState.turnUsername
    ? gameState.towers[newState.turnUsername]
      ? Object.keys(gameState.towers).indexOf(newState.turnUsername)
      : 0
    : 0;

  const nextPlayerIndex = (currentPlayerIndex + 1) % Object.keys(gameState.towers).length;
  newState.turnUsername = Object.keys(gameState.towers)[nextPlayerIndex];

  return newState;
};

export const PeerGame: FC = () => {
  const { id } = useParams();
  if (!id) throw new Error('id is required');

  const game = useMemo(() => JSON.parse(localStorage.getItem('games') ?? '{}')[id] as IGame, [id]);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connections, setConnections] = useState<Record<string, any>>({});
  const [gameState, setGameState] = useState<IBoard | null>(null);
  const [blockchain, setBlockchain] = useState<IGameBlockChain | null>(null);
  const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);
  const [publicKeyBase64, setPublicKeyBase64] = useState<string>('');
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const navigate = useNavigate();
  const username = useMemo(() => localStorage.getItem('username') || '', []);

  // Инициализация ключей и пира
  useEffect(() => {
    const initKeys = async () => {
      // Создаем или получаем сохраненную пару ключей
      let keys: CryptoKeyPair;
      const savedKeyPair = localStorage.getItem(`keyPair_${username}`);

      if (savedKeyPair) {
        // Здесь нужна логика импорта ключей из хранилища
        // Это упрощенно, в реальности надо правильно восстанавливать ключи
        keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
      } else {
        // Генерируем новую пару ключей
        keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);

        // В реальности здесь надо сохранить ключи в localStorage
      }

      setKeyPair(keys);
      const publicKeyString = await exportPublicKey(keys.publicKey);
      setPublicKeyBase64(publicKeyString);
    };

    initKeys();
    const newPeer = new Peer(`${PEER_PREFIX}${PEER_ID_SEPARATOR}${username}`);
    setPeer(newPeer);

    return () => {
      newPeer?.destroy();
    };
  }, [username]);

  // Настройка соединений и обработчиков
  useEffect(() => {
    if (!peer || !keyPair) return;

    // Обработка входящих соединений
    peer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);

      conn.on('open', () => {
        // Добавляем соединение в список
        setConnections((prev) => ({ ...prev, [conn.peer]: conn }));

        // Отправляем текущее состояние блокчейна
        if (blockchain) {
          conn.send({ type: 'BLOCKCHAIN_SYNC', data: blockchain });
        }
      });

      conn.on('data', async (data) => {
        handlePeerMessage(conn, data);
      });

      conn.on('close', () => {
        // Удаляем соединение из списка
        setConnections((prev) => {
          const newConn = { ...prev };
          delete newConn[conn.peer];
          return newConn;
        });
      });
    });

    // Если мы инициатор игры, создаем начальное состояние
    // и соединяемся с другим игроком
    const initGame = async () => {
      if (game && game.players[0] === username) {
        // Инициализируем состояние игры
        const initialState = initializeGameState(game);
        setGameState(initialState);

        // Создаем блокчейн
        const newBlockchain: IGameBlockChain = {
          initialBoard: initialState,
          blocks: [],
          latestHash: '',
        };

        setBlockchain(newBlockchain);

        // Сохраняем в localStorage
        const gameStates = JSON.parse(localStorage.getItem('game-states') || '{}');
        localStorage.setItem(
          'game-states',
          JSON.stringify({
            ...gameStates,
            [game.id]: newBlockchain,
          })
        );

        // Соединяемся с другими игроками
        for (const playerName of game.players) {
          if (playerName !== username) {
            connectToPeer(playerName);
          }
        }
      } else if (game) {
        // Если мы не инициатор, пытаемся подключиться к остальным игрокам
        for (const playerName of game.players) {
          if (playerName !== username) {
            connectToPeer(playerName);
          }
        }

        // Пытаемся загрузить сохраненное состояние
        const gameStates = JSON.parse(localStorage.getItem('game-states') || '{}');
        const savedBlockchain = gameStates[game.id] as IGameBlockChain | undefined;

        if (savedBlockchain) {
          setBlockchain(savedBlockchain);

          // Восстанавливаем текущее состояние из блокчейна
          let currentState = savedBlockchain.initialBoard;
          for (const block of savedBlockchain.blocks) {
            try {
              currentState = await applyGameState(
                currentState,
                savedBlockchain.blocks[savedBlockchain.blocks.indexOf(block) - 1] || null,
                block
              );
            } catch (error) {
              console.error('Error applying game state:', error);
              break;
            }
          }

          setGameState(currentState);
        }
      }
    };

    initGame();

    return () => {
      // Закрываем все соединения
      Object.values(connections).forEach((conn) => conn.close());
    };
  }, [peer, blockchain, connections, keyPair, game, username]);

  // Функция подключения к другому пиру
  const connectToPeer = (peerName: string) => {
    if (!peer) return;

    const targetPeerId = `${PEER_PREFIX}${PEER_ID_SEPARATOR}${peerName}`;
    console.log('Connecting to peer:', targetPeerId);

    // Проверяем, есть ли уже соединение
    if (connections[targetPeerId]) {
      console.log('Already connected to:', targetPeerId);
      return;
    }

    const conn = peer.connect(targetPeerId);

    conn.on('open', () => {
      console.log('Connected to peer:', targetPeerId);
      setConneаctions((prev) => ({ ...prev, [targetPeerId]: conn }));

      // Запрашиваем блокчейн, если у нас его нет
      if (!blockchain) {
        conn.send({ type: 'REQUEST_BLOCKCHAIN' });
      }
    });

    conn.on('data', (data) => {
      handlePeerMessage(conn, data);
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
    });

    conn.on('close', () => {
      console.log('Connection closed with:', targetPeerId);
      setConnections((prev) => {
        const newConn = { ...prev };
        delete newConn[targetPeerId];
        return newConn;
      });
    });
  };

  // Обработчик сообщений от пиров
  const handlePeerMessage = async (conn: any, message: any) => {
    console.log('Received message:', message);

    switch (message.type) {
      case 'REQUEST_BLOCKCHAIN':
        // Отправляем наш блокчейн
        if (blockchain) {
          conn.send({ type: 'BLOCKCHAIN_SYNC', data: blockchain });
        }
        break;

      case 'BLOCKCHAIN_SYNC':
        // Получили блокчейн от другого игрока
        if (!blockchain || message.data.blocks.length > blockchain.blocks.length) {
          // Проверяем целостность блокчейна
          const isValid = await validateBlockchain(message.data);

          if (isValid) {
            setBlockchain(message.data);

            // Восстанавливаем текущее состояние
            let currentState = message.data.initialBoard;
            for (const block of message.data.blocks) {
              try {
                currentState = await applyGameState(
                  currentState,
                  message.data.blocks[message.data.blocks.indexOf(block) - 1] || null,
                  block
                );
              } catch (error) {
                console.error('Error applying game state:', error);
                break;
              }
            }

            setGameState(currentState);

            // Сохраняем в localStorage
            const gameStates = JSON.parse(localStorage.getItem('game-states') || '{}');
            localStorage.setItem(
              'game-states',
              JSON.stringify({
                ...gameStates,
                [game.id]: message.data,
              })
            );
          } else {
            console.error('Received invalid blockchain');
          }
        }
        break;

      case 'NEW_BLOCK':
        // Получили новый блок от другого игрока
        if (blockchain) {
          const newBlock = message.data;

          // Проверяем, что блок действителен
          const prevBlock = blockchain.blocks.length > 0 ? blockchain.blocks[blockchain.blocks.length - 1] : null;

          try {
            // Проверяем и применяем новый блок
            const newState = await applyGameState(gameState!, prevBlock, newBlock);

            // Обновляем блокчейн и состояние
            const updatedBlockchain = {
              ...blockchain,
              blocks: [...blockchain.blocks, newBlock],
              latestHash: newBlock.hash,
            };

            setBlockchain(updatedBlockchain);
            setGameState(newState);

            // Сохраняем в localStorage
            const gameStates = JSON.parse(localStorage.getItem('game-states') || '{}');
            localStorage.setItem(
              'game-states',
              JSON.stringify({
                ...gameStates,
                [game.id]: updatedBlockchain,
              })
            );
          } catch (error) {
            console.error('Error applying new block:', error);
          }
        }
        break;
    }
  };

  // Проверяем целостность блокчейна
  const validateBlockchain = async (chain: IGameBlockChain): Promise<boolean> => {
    // Проверяем начальное состояние
    if (!chain.initialBoard) return false;

    // Проверяем все блоки
    let prevHash = '';
    for (const block of chain.blocks) {
      // Проверяем хеш предыдущего блока
      if (block.prevBlockHash !== prevHash) {
        return false;
      }

      // Проверяем подпись блока
      const isValid = await verifyBlockSignature(block);
      if (!isValid) {
        return false;
      }

      // Обновляем prevHash для следующей итерации
      prevHash = block.hash;
    }

    return true;
  };

  // Создаем новый блок при совершении действия
  const createNewBlock = async (action: IGameAction): Promise<void> => {
    if (!gameState || !blockchain || !keyPair) return;

    try {
      // Подписываем действие
      const signature = await signData(keyPair.privateKey, action);
      const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

      // Создаем новый блок
      const prevBlock = blockchain.blocks.length > 0 ? blockchain.blocks[blockchain.blocks.length - 1] : null;

      const newBlockData: Omit<IStepBlock, 'hash'> = {
        createdAt: new Date().toISOString(),
        turnUsername: username,
        prevBlockHash: prevBlock ? prevBlock.hash : '',
        action,
        signature: signatureBase64,
        publicKey: publicKeyBase64,
      };

      // Генерируем хеш для блока
      const blockHash = await createBlockHash(newBlockData);

      const newBlock: IStepBlock = {
        ...newBlockData,
        hash: blockHash,
      };

      // Применяем действие к текущему состоянию
      const newState = await applyGameState(gameState, prevBlock, newBlock);

      // Обновляем блокчейн и состояние
      const updatedBlockchain = {
        ...blockchain,
        blocks: [...blockchain.blocks, newBlock],
        latestHash: blockHash,
      };

      setBlockchain(updatedBlockchain);
      setGameState(newState);

      // Отправляем новый блок всем подключенным пирам
      Object.values(connections).forEach((conn) => {
        conn.send({ type: 'NEW_BLOCK', data: newBlock });
      });

      // Сохраняем в localStorage
      const gameStates = JSON.parse(localStorage.getItem('game-states') || '{}');
      localStorage.setItem(
        'game-states',
        JSON.stringify({
          ...gameStates,
          [game.id]: updatedBlockchain,
        })
      );
    } catch (error) {
      console.error('Error creating new block:', error);
    }
  };

  // Проверяем, наш ли сейчас ход
  useEffect(() => {
    if (gameState) {
      setIsMyTurn(gameState.turnUsername === username);
    }
  }, [gameState, username]);

  // UI для отображения игры и кнопка действия
  return (
    <PageMain>
      <Stack direction="column" gap={2}>
        <Typography variant="h1">Игра</Typography>

        {gameState && (
          <>
            <Typography variant="h2">{isMyTurn ? 'Ваш ход' : `Ход игрока: ${gameState.turnUsername}`}</Typography>

            {/* Отображение игрового поля здесь */}

            {isMyTurn && (
              <Stack direction="row" gap={2}>
                <Button
                  variant="contained"
                  onClick={() =>
                    createNewBlock({
                      type: 'PULL_CARD',
                      payload: {},
                    })
                  }
                >
                  Взять карту
                </Button>

                {/* Другие кнопки действий */}
              </Stack>
            )}
          </>
        )}

        {/* Статус подключения */}
        <Typography>Подключено к игрокам: {Object.keys(connections).length}</Typography>
      </Stack>
    </PageMain>
  );
};
