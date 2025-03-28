import clsx from 'clsx';
import { useMemo, useRef, useState } from 'react'

import numberBoxAudioPath from "/src/assets/audio/click.mp3"
import emptyBoxAudioPath from "/src/assets/audio/empty-box.mp3"
import mineBoxAudioPath from "/src/assets/audio/explode.mp3"

type Box = {
  value: number | "💣" | null;
  isOpened: boolean;
  isMarked: boolean;
};

function generateRandomNumber(max: number, except: number | number[]): number {
  if(typeof except === "number") except = [except];
  let randomNumber = Math.round(Math.random() * max);

  while (except.includes(randomNumber)) {
    randomNumber = Math.round(Math.random() * max);
  }

  return randomNumber;
};

function getIndexesOfAllSidesOfBox(targetIndex: number): number[] {
  const isTargetIndexOnFirstRow = targetIndex <= 9;
  const isTargetIndexOnFirstColumn = targetIndex % 10 == 0;
  const isTargetIndexOnLastColumn = targetIndex % 10 == 9;
  const isTargetIndexOnLastRow = targetIndex >= 90;
  
  /*
    Sides reference

    [TL] [TM] [TR]

    [L ] [M ] [R ]

    [BL] [BM] [BR]

    The middle "[M ]" is where your "targetIndex".
  */
  const TL = targetIndex-11;
  const TM = targetIndex-10;
  const TR = targetIndex-9;
  const R = targetIndex+1;
  const BR = targetIndex+11;
  const BM = targetIndex+10;
  const BL = targetIndex+9;
  const L = targetIndex-1;

  // Indexes
  const topLeft      = isTargetIndexOnFirstRow || isTargetIndexOnFirstColumn ? null : TL;
  const topMiddle    =                               isTargetIndexOnFirstRow ? null : TM;
  const topRight     =  isTargetIndexOnFirstRow || isTargetIndexOnLastColumn ? null : TR;
  const right        =                             isTargetIndexOnLastColumn ? null : R;
  const bottomRight  =   isTargetIndexOnLastColumn || isTargetIndexOnLastRow ? null : BR;
  const bottomMiddle =                                isTargetIndexOnLastRow ? null : BM;
  const bottomLeft   =  isTargetIndexOnLastRow || isTargetIndexOnFirstColumn ? null : BL;
  const left         =                            isTargetIndexOnFirstColumn ? null : L;

  return [
    topLeft,
    topMiddle,
    topRight,
    right,
    bottomRight,
    bottomMiddle,
    bottomLeft,
    left
  ].filter(value => value != null);   // Remove null values before returning. 
}

function scatterMines(indexOfFirstOpenedBox: number, initialBoxes: Box[]): Box[] {
  const MINE_COUNT = 10;

  /*
    Q:What are this indexes? 
      - We need this indexes to prevent putting mines beside the very first opened box. 
    Q:why?
      - Cause if we put mine/s beside it that mine/s also need mine counts around so that
        first opened box will be filled a number.
    Q:Why do we need the first opened box to be emptied?
      - Cause that first empty opened box is what we will use as our starting point to
        reveal any adjacent empty box.
  */
  const indexesOfallSidesOfFirstOpenedBox: number[] = getIndexesOfAllSidesOfBox(indexOfFirstOpenedBox);

  for(let i=0; i<MINE_COUNT; i++) {
    let randomIndex = generateRandomNumber(99, [...indexesOfallSidesOfFirstOpenedBox, indexOfFirstOpenedBox]);
    
    while(initialBoxes[randomIndex].value == "💣") {
      randomIndex = generateRandomNumber(99, [...indexesOfallSidesOfFirstOpenedBox, indexOfFirstOpenedBox]);
    }

    initialBoxes[randomIndex].value = "💣";

    getIndexesOfAllSidesOfBox(randomIndex).forEach(index => {
      if(initialBoxes[index].value == "💣") return;

      initialBoxes[index].value! += 1;
    });
  }

  return initialBoxes;
};

function revealSurroundings(
  index: number,
  boxes: Box[],
  setBoxes: React.Dispatch<React.SetStateAction<Box[]>>
): void {

  getIndexesOfAllSidesOfBox(index).forEach(i => {
    const { value, isOpened, isMarked } = boxes[i];
    if(value === "💣" || isOpened || isMarked) return;

    setBoxes(prev => {
      const boxesCopy = [...prev];
      boxesCopy[i].isOpened = true;

      if(boxesCopy[i].value === null) {
        revealSurroundings(i, boxesCopy, setBoxes);
      };

      return boxesCopy;
    });
  });
  
}

const initialValue = Array.from({ length: 100 }, (): Box => ({ value: null, isOpened: false, isMarked: false }));

function App() {
  const [boxes, setBoxes] = useState<Box[]>(initialValue);
  const [mineIndicator, setMineIndicator] = useState(10);
  const [isFirstClick, setIsFirstClick] = useState<boolean>(true);
  const [timer, setTimer] = useState(0);   // timer is in seconds
  
  const timerIntervalId = useRef<number | null>(0);
  const isTimerStopped = timerIntervalId.current === null;

  const isWinner = useMemo(() => {
    const openedBoxes = boxes.filter(box => box.isOpened).length;
    return openedBoxes === 90;

  }, [boxes]);

  if(isWinner) stopTimer();
  
  const formatTimer = (): string => {
    switch (timer.toString().length) {
      case 1:
        return "00"+timer;
      case 2:
        return "0"+timer;
      default:
        return ""+timer;
    }
  }

  const playSound = (clickedBox: Box):void => {
    const numberBoxAudio = new Audio(numberBoxAudioPath);
    const emptyBoxAudio = new Audio(emptyBoxAudioPath);
    const mineBoxAudio = new Audio(mineBoxAudioPath);

    switch (clickedBox.value) {
      case null:
        emptyBoxAudio.play();
        break;

      case "💣":
        mineBoxAudio.play();
        break
    
      default:
        numberBoxAudio.play();
    }
    
  }

  const markBox = (index: number) => {
    const boxesCopy = [...boxes];
    boxesCopy[index].isMarked = !boxesCopy[index].isMarked;
    setBoxes(boxesCopy);
  }

  function stopTimer(): void {
    clearInterval(timerIntervalId.current!);
    timerIntervalId.current = null;
  }

  const startTimer = () => {
    const id = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    timerIntervalId.current = id;
  }

  const updateMineIndicator = (box: Box): void => {
    if(box.isMarked) {
      setMineIndicator(mineIndicator + 1);
    }else {
      setMineIndicator(mineIndicator - 1);
    }
  }

  const restartGame = (): void => {
    clearInterval(timerIntervalId.current!);
    timerIntervalId.current = 0;

    setIsFirstClick(true);
    setTimer(0);
    setMineIndicator(10);

    /* 
      I thought to just use the "initialValue" here but the objects inside
      is what being modified throught the game cause even I destructured them to 
      create a copy of the boxes (array) the objects inside have still same references,
      so I just assigned a new fresh array here.
    */
    setBoxes(Array.from({ length: 100 }, (): Box => ({ value: null, isOpened: false, isMarked: false })));
  }

  const onClickBox = (index: number, e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    const clickedBox = boxes[index];
    const isRightClick = (e.button === 2);
    if(isRightClick) {
      updateMineIndicator(clickedBox);
      markBox(index);
      return;
    }

    if(clickedBox.isMarked) return;
    
    playSound(clickedBox);
    if(isFirstClick) {
      startTimer();

      setBoxes(scatterMines(index, boxes));
      setIsFirstClick(false);
    };

    // Because we use the "prev" here we can get the updated state made by the previous/preceded "setBoxes" setter.
    setBoxes(prev => {
      const boxesCopy = structuredClone(prev);
      boxesCopy[index].isOpened = true;
  
      return boxesCopy;
    });

    switch(clickedBox.value) {
      case null:
        revealSurroundings(index, boxes, setBoxes);
        break;
      case "💣":
        // Display Game over
        stopTimer();
        setBoxes(prev => {
          const revealAllMines = (box: Box) => box.value == "💣" ? { ...box, isOpened: true } : box;
          const boxesWithAllMinesRevealed = [...prev].map(revealAllMines);
          
          return boxesWithAllMinesRevealed;
        });
        break;
    }
  }

  return (
    <>
    <div className='w-fit select-none m-auto mt-5'>
      <div className='text-white flex justify-between'>
        <p>{mineIndicator}</p>
        <button 
          className='bg-yellow-600 px-2 py-1 active:scale-95'
          onClick={restartGame}
        >
          Reset
        </button>
        <p>{formatTimer()}</p>
      </div>

      <div 
        className='w-96 bg-black aspect-square grid grid-cols-10 grid-rows-10' 
        onContextMenu={(e) => e.preventDefault()}
      >
        {
          boxes.map((box, index) => {
            return (
              <button 
                className={clsx(
                  "bg-blue-500 select-none cursor-default hover:bg-blue-400 active:scale-95 border-black border-solid border-2",
                  (isTimerStopped || box.isOpened) && "pointer-events-none",
                  box.isOpened && "bg-gray-300"
                )}
                key={index}
                onMouseDown={(e) => onClickBox(index, e)}
              >
                {box.isOpened && box.value}
                {box.isMarked && !box.isOpened && "🚩"}
              </button>
            )
          })
        }
      </div>
    </div>

    <a href='https://github.com/jam6123/minesweeper' 
      target='_blank' 
      className='fixed right-6 bottom-6 cursor-pointer'
    >
      <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="32" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24" className="w-8 h-8 text-white hover:text-gray-300 transition duration-75"><path d="M12 2.247a10 10 0 0 0-3.162 19.487c.5.088.687-.212.687-.475c0-.237-.012-1.025-.012-1.862c-2.513.462-3.163-.613-3.363-1.175a3.636 3.636 0 0 0-1.025-1.413c-.35-.187-.85-.65-.013-.662a2.001 2.001 0 0 1 1.538 1.025a2.137 2.137 0 0 0 2.912.825a2.104 2.104 0 0 1 .638-1.338c-2.225-.25-4.55-1.112-4.55-4.937a3.892 3.892 0 0 1 1.025-2.688a3.594 3.594 0 0 1 .1-2.65s.837-.262 2.75 1.025a9.427 9.427 0 0 1 5 0c1.912-1.3 2.75-1.025 2.75-1.025a3.593 3.593 0 0 1 .1 2.65a3.869 3.869 0 0 1 1.025 2.688c0 3.837-2.338 4.687-4.563 4.937a2.368 2.368 0 0 1 .675 1.85c0 1.338-.012 2.413-.012 2.75c0 .263.187.575.687.475A10.005 10.005 0 0 0 12 2.247z" fill="currentColor"></path></svg>
    </a>

    <h1 className='text-white text-xs fixed bottom-4 left-1/2 -translate-x-1/2'>
      May druglord bang pogi???&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;¯\_(ツ)_/¯
    </h1>
    </>
  )
}

export default App
