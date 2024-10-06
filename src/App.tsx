import { useEffect, useState } from 'react'

/*
  Project date started October 6 2024, 01:00 AM
  *********PROGRESS*********
  1. Putting mine count on left side of every mine. - DONE
  2. Putting mine count on right side of every mine. - DONE
  3. Putting mine count on bottom-left side of every mine. - DONE
  4. Putting mine count on bottom-middle of every mine. - DONE
  5. Putting mine count on bottom-right side of every mine. - DONE
  6. Putting mine count on top side of every mine. - DONE
  7. Putting mine count on top-right side of every mine. - DONE
  8. Putting mine count on top-left side of every mine. - DONE
  9. Making sure the first click is always an empty box. - DONE
  
*/

type BoxValue = number | "💣";

function scatterMines(indexOfFirstOpenedBox: number) {
  const boxes: BoxValue[] = Array(100).fill(null);
  const MINE_COUNT = 20;

  for(let i=0; i<MINE_COUNT; i++) {
    // Putting a mine on each random box
    const randomIndex = Math.round(Math.random() * 99);
    if(boxes[randomIndex] == "💣") {
      i -= 1
      continue;
    };
    boxes[randomIndex] = "💣";

    // Putting mine count on right side
    const isRightSideOfMineNotAMine = boxes[randomIndex+1] != "💣";
    const isMineNotOnTheLastColumn = randomIndex % 10 != 9;
    if(isMineNotOnTheLastColumn && isRightSideOfMineNotAMine) boxes[randomIndex+1] = +boxes[randomIndex+1] + 1;
    
    // Putting mine count on left side
    const isLeftSideOfMineNotAMine = boxes[randomIndex-1] != "💣";
    const isMineNotOnTheFirstColumn = randomIndex % 10 != 0;
    if(isMineNotOnTheFirstColumn && isLeftSideOfMineNotAMine) boxes[randomIndex-1] = +boxes[randomIndex-1] + 1;
    
    // Putting mine count on bottom-left side
    const isMineNotOnTheLastRow = !(randomIndex >= 90);
    const isBottomLeftOfMineNotAMine = boxes[randomIndex+9] != "💣";
    if(isMineNotOnTheFirstColumn && isBottomLeftOfMineNotAMine && isMineNotOnTheLastRow) boxes[randomIndex+9] = +boxes[randomIndex+9] + 1;

    // Putting mine count on bottom-right side
    const isBottomRightSideOfMineNotAMine = boxes[randomIndex+11] != "💣";
    if(isMineNotOnTheLastColumn && isBottomRightSideOfMineNotAMine && isMineNotOnTheLastRow) boxes[randomIndex+11] = +boxes[randomIndex+11] + 1;

    // Putting mine count on bottom-middle side
    const isBottomMiddleOfMineNotAMine = boxes[randomIndex+10] != "💣";
    if(isBottomMiddleOfMineNotAMine && isMineNotOnTheLastRow) boxes[randomIndex+10] = +boxes[randomIndex+10] + 1;

    // Putting mine count on top side
    const isMineNotOnTheFirstRow = !(randomIndex <= 9);
    const isTopOfMineNotAMine = boxes[randomIndex-10] != "💣";
    if(isMineNotOnTheFirstRow && isTopOfMineNotAMine) boxes[randomIndex-10] = +boxes[randomIndex-10] + 1;

    // Putting mine count on top-right side
    const isTopRightOfMineNotAMine = boxes[randomIndex-9] != "💣";
    if(isMineNotOnTheFirstRow && isTopRightOfMineNotAMine && isMineNotOnTheLastColumn) boxes[randomIndex-9] = +boxes[randomIndex-9] + 1;

    // Putting mine count on top-left side
    const isTopLeftOfMineNotAMine = boxes[randomIndex-11] != "💣";
    if(isMineNotOnTheFirstRow && isTopLeftOfMineNotAMine && isMineNotOnTheFirstColumn) boxes[randomIndex-11] = +boxes[randomIndex-11] + 1;

  }
  
  if(boxes[indexOfFirstOpenedBox] != null) {
    return scatterMines(indexOfFirstOpenedBox);
  }
  return boxes;
};

function App() {
  const [boxes, setBoxes] = useState<BoxValue[]>(Array(100).fill(null));
  const [openedBoxesIndex, setopenedBoxesIndex] = useState<number[]>([]);
  const [isFirstClick, setIsFirstClick] = useState<Boolean>(true);

  const openBox = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, index: number, box: BoxValue ) => {
    e.currentTarget.classList.add("bg-gray-300");
    e.currentTarget.classList.add("pointer-events-none");

    if(isFirstClick) {
      setBoxes(scatterMines(index));
      setIsFirstClick(false);
    };

    setopenedBoxesIndex([...openedBoxesIndex, index]);
    if(box == "💣") console.log("KABOOM!!!")
  };

  return (
    <>
      <div className='w-96 bg-black aspect-square grid grid-cols-10 grid-rows-10'>
        {
          boxes.map((box, index) => {
            return (
              <button 
                className='bg-blue-500 select-none cursor-default hover:bg-blue-400 active:scale-95 border-black border-solid border-2' 
                key={index}
                onMouseDown={(e) => openBox(e, index, box)}
              >
                {openedBoxesIndex.includes(index) && box}
              </button>
            )
          })
        }
      </div>
    </>
  )
}

export default App
