// Ultimate Tic Tac Toe - Pure JavaScript Implementation (Dark Mode)
// Board dimensions: 1080px x 600px

// Game variables
let board;
let context;
let currentPlayer = "X"; // Start with player X
let activeBoard = null; // Which small board is active (null means player can choose any)
let gameOver = false;
let winner = null;

// Board measurements
const BOARD_WIDTH = 1080;
const BOARD_HEIGHT = 600;
const BOARD_MARGIN = 20;
const GAME_WIDTH = BOARD_HEIGHT - (BOARD_MARGIN * 2); // Square game area
const GAME_HEIGHT = GAME_WIDTH;
const GAME_OFFSET_X = BOARD_MARGIN + 120; // Moved game board more to the right
const GAME_OFFSET_Y = BOARD_MARGIN;
const INFO_OFFSET_X = GAME_OFFSET_X + GAME_WIDTH + BOARD_MARGIN;
const INFO_WIDTH = BOARD_WIDTH - INFO_OFFSET_X - BOARD_MARGIN;

// Board dimensions
const MAIN_BOARD_SIZE = 3;
const SUB_BOARD_SIZE = 3;
const CELL_SIZE = GAME_WIDTH / (MAIN_BOARD_SIZE * SUB_BOARD_SIZE);
const BOARD_SIZE = CELL_SIZE * SUB_BOARD_SIZE;

// Line widths
const THIN_LINE_WIDTH = 1;
const THICK_LINE_WIDTH = 4;

// Colors - Dark mode theme
const BACKGROUND_COLOR = "#121212"; // Dark background
const LINE_COLOR = "#BBBBBB"; // Light gray lines
const ACTIVE_BOARD_COLOR = "rgba(0, 128, 255, 0.15)"; // More subtle highlight
const PLAYER_X_COLOR = "#4F8EF7"; // Light blue for X
const PLAYER_O_COLOR = "#F76E6E"; // Light red for O
const GAME_OVER_COLOR = "rgba(0, 0, 0, 0.85)";
const TEXT_COLOR = "#E0E0E0"; // Light gray text

// Game state
const mainBoard = Array(MAIN_BOARD_SIZE).fill().map(() => 
    Array(MAIN_BOARD_SIZE).fill().map(() => ({
        winner: null,
        cells: Array(SUB_BOARD_SIZE).fill().map(() => 
            Array(SUB_BOARD_SIZE).fill(null)
        )
    }))
);

// Initialize the game when the window loads
window.onload = function() {
    board = document.getElementById("board");
    board.width = BOARD_WIDTH;
    board.height = BOARD_HEIGHT;
    context = board.getContext("2d");
    
    // Set dark mode for the page
    document.body.style.backgroundColor = BACKGROUND_COLOR;
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    
    board.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    
    drawBoard();
    updateInfo();
};

// Handle keyboard events for spacebar reset
function handleKeyDown(event) {
    if (event.code === "Space" && gameOver) {
        resetGame();
        event.preventDefault(); // Prevent scrolling when pressing space
    }
}

// Handle click events
function handleClick(event) {
    if (gameOver) {
        return;
    }
    
    // Calculate the position on the canvas
    const rect = board.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if click is within the game area
    if (x < GAME_OFFSET_X || x > GAME_OFFSET_X + GAME_WIDTH || 
        y < GAME_OFFSET_Y || y > GAME_OFFSET_Y + GAME_HEIGHT) {
        return;
    }
    
    // Calculate which cell was clicked
    const relX = x - GAME_OFFSET_X;
    const relY = y - GAME_OFFSET_Y;
    
    const mainRow = Math.floor(relY / BOARD_SIZE);
    const mainCol = Math.floor(relX / BOARD_SIZE);
    const subRow = Math.floor((relY % BOARD_SIZE) / CELL_SIZE);
    const subCol = Math.floor((relX % BOARD_SIZE) / CELL_SIZE);
    
    // Check if this is a valid move
    if (activeBoard !== null) {
        // If there's an active board, only allow moves in that board
        if (activeBoard.row !== mainRow || activeBoard.col !== mainCol) {
            return;
        }
    }
    
    // Check if the subboard is already won
    if (mainBoard[mainRow][mainCol].winner !== null) {
        return;
    }
    
    // Check if the cell is already occupied
    if (mainBoard[mainRow][mainCol].cells[subRow][subCol] !== null) {
        return;
    }
    
    // Make the move
    mainBoard[mainRow][mainCol].cells[subRow][subCol] = currentPlayer;
    
    // Check if the move won the subboard
    if (checkSubBoardWin(mainRow, mainCol)) {
        mainBoard[mainRow][mainCol].winner = currentPlayer;
        
        // Check if the move won the main board
        if (checkMainBoardWin()) {
            winner = currentPlayer;
            gameOver = true;
        }
    }
    
    // Determine the next active board based on the last move
    if (mainBoard[subRow][subCol].winner === null) {
        activeBoard = { row: subRow, col: subCol };
    } else {
        activeBoard = null; // If the target board is already won, player can choose any board
    }
    
    // Switch player
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    
    // Redraw the board
    drawBoard();
    updateInfo();
    
    // Check if the game is a draw
    if (!gameOver && checkForDraw()) {
        gameOver = true;
        winner = "Draw";
        updateInfo();
        drawGameOver();
    }
    
    // If game is over, draw game over screen
    if (gameOver) {
        drawGameOver();
    }
}

// Check if a move won a subboard
function checkSubBoardWin(mainRow, mainCol) {
    const board = mainBoard[mainRow][mainCol].cells;
    const size = SUB_BOARD_SIZE;
    const player = currentPlayer;
    
    // Check rows
    for (let i = 0; i < size; i++) {
        if (board[i][0] === player && board[i][1] === player && board[i][2] === player) {
            return true;
        }
    }
    
    // Check columns
    for (let i = 0; i < size; i++) {
        if (board[0][i] === player && board[1][i] === player && board[2][i] === player) {
            return true;
        }
    }
    
    // Check diagonals
    if (board[0][0] === player && board[1][1] === player && board[2][2] === player) {
        return true;
    }
    if (board[0][2] === player && board[1][1] === player && board[2][0] === player) {
        return true;
    }
    
    return false;
}

// Check if the game is won on the main board
function checkMainBoardWin() {
    const size = MAIN_BOARD_SIZE;
    const player = currentPlayer;
    
    // Check rows
    for (let i = 0; i < size; i++) {
        if (mainBoard[i][0].winner === player && 
            mainBoard[i][1].winner === player && 
            mainBoard[i][2].winner === player) {
            return true;
        }
    }
    
    // Check columns
    for (let i = 0; i < size; i++) {
        if (mainBoard[0][i].winner === player && 
            mainBoard[1][i].winner === player && 
            mainBoard[2][i].winner === player) {
            return true;
        }
    }
    
    // Check diagonals
    if (mainBoard[0][0].winner === player && 
        mainBoard[1][1].winner === player && 
        mainBoard[2][2].winner === player) {
        return true;
    }
    if (mainBoard[0][2].winner === player && 
        mainBoard[1][1].winner === player && 
        mainBoard[2][0].winner === player) {
        return true;
    }
    
    return false;
}

// Check if the game is a draw
function checkForDraw() {
    // Check if all cells in all boards are filled or if all boards have winners
    for (let i = 0; i < MAIN_BOARD_SIZE; i++) {
        for (let j = 0; j < MAIN_BOARD_SIZE; j++) {
            if (mainBoard[i][j].winner === null) {
                // Check if there are still empty cells in this subboard
                for (let k = 0; k < SUB_BOARD_SIZE; k++) {
                    for (let l = 0; l < SUB_BOARD_SIZE; l++) {
                        if (mainBoard[i][j].cells[k][l] === null) {
                            return false; // There's still an empty cell
                        }
                    }
                }
            }
        }
    }
    return true;
}

// Draw the game board
function drawBoard() {
    // Clear the canvas
    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
    
    // Draw the main board grid
    drawMainGrid();
    
    // Draw the subboard grids and marks
    for (let i = 0; i < MAIN_BOARD_SIZE; i++) {
        for (let j = 0; j < MAIN_BOARD_SIZE; j++) {
            // Highlight the active board with a more subtle effect
            if (activeBoard !== null && activeBoard.row === i && activeBoard.col === j) {
                context.fillStyle = ACTIVE_BOARD_COLOR;
                context.fillRect(
                    GAME_OFFSET_X + j * BOARD_SIZE, 
                    GAME_OFFSET_Y + i * BOARD_SIZE, 
                    BOARD_SIZE, 
                    BOARD_SIZE
                );
            }
            
            // Draw subboard grid
            drawSubGrid(i, j);
            
            // Draw the X's and O's in the subboard
            drawMarks(i, j);
            
            // If the subboard has a winner, draw over it
            if (mainBoard[i][j].winner !== null) {
                drawSubBoardWinner(i, j);
            }
        }
    }
}

// Draw the main grid
function drawMainGrid() {
    context.strokeStyle = LINE_COLOR;
    
    // Draw the vertical lines
    for (let i = 1; i < MAIN_BOARD_SIZE; i++) {
        context.lineWidth = THICK_LINE_WIDTH;
        context.beginPath();
        context.moveTo(GAME_OFFSET_X + i * BOARD_SIZE, GAME_OFFSET_Y);
        context.lineTo(GAME_OFFSET_X + i * BOARD_SIZE, GAME_OFFSET_Y + GAME_HEIGHT);
        context.stroke();
    }
    
    // Draw the horizontal lines
    for (let i = 1; i < MAIN_BOARD_SIZE; i++) {
        context.lineWidth = THICK_LINE_WIDTH;
        context.beginPath();
        context.moveTo(GAME_OFFSET_X, GAME_OFFSET_Y + i * BOARD_SIZE);
        context.lineTo(GAME_OFFSET_X + GAME_WIDTH, GAME_OFFSET_Y + i * BOARD_SIZE);
        context.stroke();
    }
}

// Draw a subgrid for a specific main cell
function drawSubGrid(mainRow, mainCol) {
    context.strokeStyle = LINE_COLOR;
    context.lineWidth = THIN_LINE_WIDTH;
    
    const startX = GAME_OFFSET_X + mainCol * BOARD_SIZE;
    const startY = GAME_OFFSET_Y + mainRow * BOARD_SIZE;
    
    // Draw the vertical lines
    for (let i = 1; i < SUB_BOARD_SIZE; i++) {
        context.beginPath();
        context.moveTo(startX + i * CELL_SIZE, startY);
        context.lineTo(startX + i * CELL_SIZE, startY + BOARD_SIZE);
        context.stroke();
    }
    
    // Draw the horizontal lines
    for (let i = 1; i < SUB_BOARD_SIZE; i++) {
        context.beginPath();
        context.moveTo(startX, startY + i * CELL_SIZE);
        context.lineTo(startX + BOARD_SIZE, startY + i * CELL_SIZE);
        context.stroke();
    }
}

// Draw the X's and O's in a subboard
function drawMarks(mainRow, mainCol) {
    const subBoard = mainBoard[mainRow][mainCol];
    
    for (let i = 0; i < SUB_BOARD_SIZE; i++) {
        for (let j = 0; j < SUB_BOARD_SIZE; j++) {
            const mark = subBoard.cells[i][j];
            if (mark !== null) {
                const x = GAME_OFFSET_X + mainCol * BOARD_SIZE + j * CELL_SIZE;
                const y = GAME_OFFSET_Y + mainRow * BOARD_SIZE + i * CELL_SIZE;
                
                if (mark === "X") {
                    drawX(x, y);
                } else {
                    drawO(x, y);
                }
            }
        }
    }
}

// Draw an X mark
function drawX(x, y) {
    const padding = CELL_SIZE * 0.2;
    context.strokeStyle = PLAYER_X_COLOR;
    context.lineWidth = 3; // Thicker lines for better visibility
    
    context.beginPath();
    context.moveTo(x + padding, y + padding);
    context.lineTo(x + CELL_SIZE - padding, y + CELL_SIZE - padding);
    context.stroke();
    
    context.beginPath();
    context.moveTo(x + CELL_SIZE - padding, y + padding);
    context.lineTo(x + padding, y + CELL_SIZE - padding);
    context.stroke();
}

// Draw an O mark
function drawO(x, y) {
    const radius = CELL_SIZE * 0.4;
    const centerX = x + CELL_SIZE / 2;
    const centerY = y + CELL_SIZE / 2;
    
    context.strokeStyle = PLAYER_O_COLOR;
    context.lineWidth = 3; // Thicker lines for better visibility
    
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.stroke();
}

// Draw a winner mark over a subboard
function drawSubBoardWinner(mainRow, mainCol) {
    const winner = mainBoard[mainRow][mainCol].winner;
    const x = GAME_OFFSET_X + mainCol * BOARD_SIZE;
    const y = GAME_OFFSET_Y + mainRow * BOARD_SIZE;
    
    // Semi-transparent overlay with darker colors for dark mode
    if (winner === "X") {
        context.fillStyle = "rgba(79, 142, 247, 0.2)"; // Dark blue tint
    } else {
        context.fillStyle = "rgba(247, 110, 110, 0.2)"; // Dark red tint
    }
    context.fillRect(x, y, BOARD_SIZE, BOARD_SIZE);
    
    // Draw winner mark
    if (winner === "X") {
        context.strokeStyle = PLAYER_X_COLOR;
        context.lineWidth = 6; // Even thicker for visibility
        
        const padding = BOARD_SIZE * 0.2;
        
        context.beginPath();
        context.moveTo(x + padding, y + padding);
        context.lineTo(x + BOARD_SIZE - padding, y + BOARD_SIZE - padding);
        context.stroke();
        
        context.beginPath();
        context.moveTo(x + BOARD_SIZE - padding, y + padding);
        context.lineTo(x + padding, y + BOARD_SIZE - padding);
        context.stroke();
    } else if (winner === "O") {
        context.strokeStyle = PLAYER_O_COLOR;
        context.lineWidth = 6; // Even thicker for visibility
        
        const radius = BOARD_SIZE * 0.4;
        const centerX = x + BOARD_SIZE / 2;
        const centerY = y + BOARD_SIZE / 2;
        
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, Math.PI * 2);
        context.stroke();
    }
}

// Update the info panel - simplified to only show current player
function updateInfo() {
    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(INFO_OFFSET_X, GAME_OFFSET_Y, INFO_WIDTH, GAME_HEIGHT);
    
    // Player turn indicator - larger and more prominent
    context.font = "32px Arial";
    context.textAlign = "center";
    context.fillStyle = TEXT_COLOR;
    context.fillText("Current Player", INFO_OFFSET_X + INFO_WIDTH / 2, GAME_OFFSET_Y + 180);
    
    // Current player symbol - much larger
    const playerIndicatorY = GAME_OFFSET_Y + 300;
    const playerSymbolSize = 200;
    
    // Add player background card with color (darker for dark mode)
    if (currentPlayer === "X") {
        // Blue card background for X
        context.fillStyle = "rgba(79, 142, 247, 0.15)";
    } else {
        // Red card background for O
        context.fillStyle = "rgba(247, 110, 110, 0.15)";
    }
    
    // Draw rounded rectangle card
    const cardX = INFO_OFFSET_X + 20;
    const cardY = playerIndicatorY - 100;
    const cardWidth = INFO_WIDTH - 40;
    const cardHeight = 200;
    const cardRadius = 15;
    
    // Draw card background
    context.beginPath();
    context.roundRect(cardX, cardY, cardWidth, cardHeight, [cardRadius]);
    context.fill();
    
    // Add border to card
    context.strokeStyle = currentPlayer === "X" ? "rgba(79, 142, 247, 0.5)" : "rgba(247, 110, 110, 0.5)";
    context.lineWidth = 3;
    context.stroke();
    
    // Draw player symbol
    if (currentPlayer === "X") {
        context.fillStyle = PLAYER_X_COLOR;
        context.font = `${playerSymbolSize}px Arial`;
        context.fillText("X", INFO_OFFSET_X + INFO_WIDTH / 2, playerIndicatorY + 70);
    } else {
        context.fillStyle = PLAYER_O_COLOR;
        context.font = `${playerSymbolSize}px Arial`;
        context.fillText("O", INFO_OFFSET_X + INFO_WIDTH / 2, playerIndicatorY + 70);
    }
    
    // Game status - only show if game is over
    if (gameOver) {
        context.fillStyle = TEXT_COLOR;
        context.font = "24px Arial";
        context.textAlign = "center";
        context.fillText("Game Status:", INFO_OFFSET_X + INFO_WIDTH / 2, GAME_OFFSET_Y + 380);
        
        if (winner === "Draw") {
            context.fillText("Game Over - Draw!", INFO_OFFSET_X + INFO_WIDTH / 2, GAME_OFFSET_Y + 420);
        } else {
            context.fillStyle = winner === "X" ? PLAYER_X_COLOR : PLAYER_O_COLOR;
            context.fillText(`Player ${winner} Wins!`, INFO_OFFSET_X + INFO_WIDTH / 2, GAME_OFFSET_Y + 420);
        }
        
        // Show reset instruction
        context.fillStyle = TEXT_COLOR;
        context.font = "18px Arial";
        context.fillText("Press SPACEBAR to restart", INFO_OFFSET_X + INFO_WIDTH / 2, GAME_OFFSET_Y + 460);
    }
    
    // Show subtle indicator for active board near the bottom of the info panel
    if (!gameOver) {
        context.fillStyle = TEXT_COLOR;
        context.font = "16px Arial";
        context.textAlign = "center";
        
        if (activeBoard === null) {
            context.fillText("Any board is active", INFO_OFFSET_X + INFO_WIDTH / 2, GAME_OFFSET_Y + GAME_HEIGHT - 100);
        } else {
            context.fillText(`Active: R${activeBoard.row + 1}, C${activeBoard.col + 1}`, 
                           INFO_OFFSET_X + INFO_WIDTH / 2, GAME_OFFSET_Y + GAME_HEIGHT - 100);
        }
    }
}

// Draw game over screen
function drawGameOver() {
    context.fillStyle = GAME_OVER_COLOR;
    context.fillRect(GAME_OFFSET_X, GAME_OFFSET_Y, GAME_WIDTH, GAME_HEIGHT);
    
    context.fillStyle = "white";
    context.font = "64px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    
    if (winner === "Draw") {
        context.fillText("DRAW!", GAME_OFFSET_X + GAME_WIDTH / 2, GAME_OFFSET_Y + GAME_HEIGHT / 2 - 40);
    } else {
        // Use player color for the winner announcement
        context.fillStyle = winner === "X" ? PLAYER_X_COLOR : PLAYER_O_COLOR;
        context.fillText(`PLAYER ${winner} WINS!`, 
                        GAME_OFFSET_X + GAME_WIDTH / 2, 
                        GAME_OFFSET_Y + GAME_HEIGHT / 2 - 40);
    }
    
    context.fillStyle = "white";
    context.font = "28px Arial";
    context.fillText("Press SPACEBAR to play again", 
                    GAME_OFFSET_X + GAME_WIDTH / 2, 
                    GAME_OFFSET_Y + GAME_HEIGHT / 2 + 50);
}

// Reset the game
function resetGame() {
    // Reset the game state
    currentPlayer = "X";
    activeBoard = null;
    gameOver = false;
    winner = null;
    
    // Reset the main board
    for (let i = 0; i < MAIN_BOARD_SIZE; i++) {
        for (let j = 0; j < MAIN_BOARD_SIZE; j++) {
            mainBoard[i][j].winner = null;
            for (let k = 0; k < SUB_BOARD_SIZE; k++) {
                for (let l = 0; l < SUB_BOARD_SIZE; l++) {
                    mainBoard[i][j].cells[k][l] = null;
                }
            }
        }
    }
    
    // Redraw the board
    drawBoard();
    updateInfo();
}