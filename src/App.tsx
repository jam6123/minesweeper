import clsx from 'clsx';
import { useState } from 'react'

type Box = {
  value: number | "💣" | null;
  isOpen: boolean;
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

function scatterMines(indexOfFirstOpenedBox: number): Box[] {
  const BOXES = Array.from({ length: 100 }, (): Box => ({ value: null, isOpen: false }));
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
    
    while(BOXES[randomIndex].value == "💣") {
      randomIndex = generateRandomNumber(99, [...indexesOfallSidesOfFirstOpenedBox, indexOfFirstOpenedBox]);
    }

    BOXES[randomIndex].value = "💣";

    getIndexesOfAllSidesOfBox(randomIndex).forEach(index => {
      if(BOXES[index].value == "💣") return;

      BOXES[index].value! += 1;
    });
  }

  return BOXES;
};

function revealSurroundings(
  index: number,
  boxes: Box[],
  setBoxes: React.Dispatch<React.SetStateAction<Box[]>>
): void {

  getIndexesOfAllSidesOfBox(index).forEach(i => {
    if(boxes[i].value === "💣" || boxes[i].isOpen) return;

    setBoxes(prev => {
      const boxesCopy = [...prev];
      boxesCopy[i].isOpen = true;

      if(boxesCopy[i].value === null) {
        revealSurroundings(i, boxesCopy, setBoxes);
      };

      return boxesCopy;
    });
  });
  
}

const initialValue = Array.from({ length: 100 }, (): Box => ({ value: null, isOpen: false }));

function App() {
  const [boxes, setBoxes] = useState<Box[]>(initialValue);
  const [isFirstClick, setIsFirstClick] = useState<Boolean>(true);

  const onClickBox = (index: number): void => {
    if(isFirstClick) {
      setBoxes(scatterMines(index));
      setIsFirstClick(false);
    };

    // Because we use the "prev" here we can get the updated state made by the previous/preceded "setBoxes" setter.
    setBoxes(prev => {
      const boxesCopy = [...prev];
      boxesCopy[index].isOpen = true;
  
      return boxesCopy;
    });

    if(boxes[index].value === null) {
      revealSurroundings(index, boxes, setBoxes);
      return;

    }else if(boxes[index].value === "💣") {
      // Display Game over ********
      setBoxes(prev => {
        const revealAllMines = (box: Box) => box.value == "💣" ? { ...box, isOpen: true } : box;
        const boxesCopy = [...prev].map(revealAllMines);
        
        return boxesCopy;
      });
    };

  };
  
  return (
    <>
      <div className='w-96 bg-black aspect-square grid grid-cols-10 grid-rows-10'>
        {
          boxes.map((box, index) => {
            return (
              <button 
                className={clsx(
                  "bg-blue-500 select-none cursor-default hover:bg-blue-400 active:scale-95 border-black border-solid border-2",
                  box.isOpen && "bg-gray-300 pointer-events-none"
                )}
                key={index}
                onMouseDown={() => onClickBox(index)}
              >
                {box.isOpen && box.value}
              </button>
            )
          })
        }
      </div>
    </>
  )
}

export default App
