import clsx from 'clsx';
import { useRef, useState } from 'react'

type Box = {
  value: number | "💣" | null;
  isOpened: boolean;
  isMarked: boolean;
};

function generateRandomNumber(max: number, except: number | number[]): number {
  if(typeof except === "number") except = [except];
  let result = Math.round(Math.random() * max);

  while (except.includes(result)) {
    result = Math.round(Math.random() * max);
  }

  return result;
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
  ].filter(value => value != null);   // Remove null values. 
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
    // Do not reveal if...
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
  const [isFirstClick, setIsFirstClick] = useState<Boolean>(true);
  const [timer, setTimer] = useState(0);   // timer is in seconds
  
  const timerIntervalId = useRef<number | null>(0);
  const isGameOver = timerIntervalId.current === null;
  
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

  const playSound = (box: Box):void => {
    const numberBoxAudio = new Audio("/src/assests/audio/click.mp3");
    const emptyBoxAudio = new Audio("/src/assests/audio/empty-box.mp3");
    const mineBoxAudio = new Audio("/src/assests/audio/explode.mp3");

    switch (box.value) {
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

  const stopTimer = () => {
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
  
  const onClickBox = (index: number, e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    const clickedBox = boxes[index];
    const isRightClick = e.button === 2;
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
      const boxesCopy = [...prev];
      boxesCopy[index].isOpened = true;
  
      return boxesCopy;
    });

    switch(clickedBox.value) {
      case null:
        revealSurroundings(index, boxes, setBoxes);
        break;
      case "💣":
        // Display Game over ********
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
    <div className='w-fit select-none'>
      <div className='text-white flex justify-between'>
        <p>{mineIndicator}</p>
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
                  (isGameOver || box.isOpened) && "pointer-events-none",
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
  )
}

export default App
