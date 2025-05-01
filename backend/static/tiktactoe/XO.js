// Ultimate Tic Tac Toe - Pure JavaScript Implementation (Dark Mode)
// Board dimensions: 1080px x 600px

// Game variables
let board;
let context;
let currentPlayer = "X"; // Start with player X
let activeBoard = null; // Which small board is active (null means player can choose any)
let gameOver = false;
let winner = null;

// sounds
var drawSound      = new Audio('draw-sound.mp3');
drawSound.preload   = 'auto';
var captureSound   = new Audio('capture-sound.mp3');
captureSound.preload= 'auto';
var winSound       = new Audio('win-sound.mp3');
winSound.preload    = 'auto';   

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
const ACTIVE_BOARD_COLOR = "rgba(128, 128, 128, 0.3)"; // Changed to transparent gray
const PLAYER_X_COLOR = "#4F8EF7"; // Light blue for X
const PLAYER_O_COLOR = "#F76E6E"; // Light red for O
const GAME_OVER_COLOR = "rgba(0, 0, 0, 0.85)";
const TEXT_COLOR = "#E0E0E0"; // Light gray text
const DRAW_COLOR = "rgba(180, 180, 180, 0.2)"; // Color for draw indicators

// Game state
const mainBoard = Array(MAIN_BOARD_SIZE).fill().map(() => 
    Array(MAIN_BOARD_SIZE).fill().map(() => ({
        winner: null,
        isDraw: false, // Added draw state for sub-boards
        cells: Array(SUB_BOARD_SIZE).fill().map(() => 
            Array(SUB_BOARD_SIZE).fill(null)
        )
    }))
);
// Game configuration
const GAME_NAME = 'UltimateTicTacToe';

// Added favButton variable
let favButton;

// Added favorites helpers functions
// Initialize the favorites button state and click handler
function initFavoriteButton() {
    favButton = document.getElementById('fav-btn');
    fetch('/my_favorites', { credentials: 'same-origin' })
        .then(r => r.json())
        .then(list => {
            const isFav = list.includes(GAME_NAME);
            favButton.classList.toggle('favorited', isFav);
            favButton.innerText = isFav
                ? '★ Remove from Favorites'
                : '☆ Add to Favorites';
            favButton.addEventListener('click', toggleFavorite);
        })
        .catch(err => console.error('Error loading favorites:', err));
}

// Toggle favorite/unfavorite on button click
function toggleFavorite() {
    const isFav = favButton.classList.contains('favorited');
    const url = isFav ? '/unfavorite' : '/favorite';
    fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `game=${encodeURIComponent(GAME_NAME)}`
    })
    .then(r => r.json())
    .then(data => {
        if ((isFav && data.status === 'removed') ||
            (!isFav && data.status === 'added')) {
            favButton.classList.toggle('favorited');
            favButton.innerText = favButton.classList.contains('favorited')
                ? '★ Remove from Favorites'
                : '☆ Add to Favorites';
        } else {
            console.error('Favorite toggle failed:', data);
        }
    })
    .catch(err => console.error('Error toggling favorite:', err));
}
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
    
    
    board.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    initFavoriteButton();

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
    
    // Check if the subboard is already won or drawn
    if (mainBoard[mainRow][mainCol].winner !== null || mainBoard[mainRow][mainCol].isDraw) {
        return;
    }
    
    // Check if the cell is already occupied
    if (mainBoard[mainRow][mainCol].cells[subRow][subCol] !== null) {
        return;
    }
    
    // Make the move
    mainBoard[mainRow][mainCol].cells[subRow][subCol] = currentPlayer;
    
    // Play draw sound every time a player places an X or O
    drawSound.currentTime = 4;
    drawSound.play();
    
    // Check if the move won the subboard
    if (checkSubBoardWin(mainRow, mainCol)) {
        captureSound.play();
        mainBoard[mainRow][mainCol].winner = currentPlayer;
        
        // Check if the move won the main board
        if (checkMainBoardWin()) {
            winner = currentPlayer;
            gameOver = true;
            winSound.play(); // Play win sound when a player wins the game
        }
    } 
    // Check if the sub-board is a draw
    else if (checkSubBoardDraw(mainRow, mainCol)) {
        mainBoard[mainRow][mainCol].isDraw = true;
        // We'll still play the capture sound instead of draw sound for sub-board draws
        captureSound.play();
    }
    
    // Check if the main board is now a draw - must check after evaluating the current move
    if (!gameOver && checkMainBoardDraw()) {
        gameOver = true;
        winner = "Draw";
        captureSound.play(); // Use capture sound for final draw
    }
    
    // Determine the next active board based on the last move
    if (!mainBoard[subRow][subCol].winner && !mainBoard[subRow][subCol].isDraw) {
        activeBoard = { row: subRow, col: subCol };
    } else {
        activeBoard = null; // If the target board is already won or drawn, player can choose any board
    }
    
    // Switch player
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    
    // Redraw the board
    drawBoard();
    updateInfo();
    
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

// Check if a sub-board is a draw (all cells filled but no winner)
function checkSubBoardDraw(mainRow, mainCol) {
    const board = mainBoard[mainRow][mainCol].cells;
    
    // Check if all cells are filled
    for (let i = 0; i < SUB_BOARD_SIZE; i++) {
        for (let j = 0; j < SUB_BOARD_SIZE; j++) {
            if (board[i][j] === null) {
                return false; // There's an empty cell, so not a draw yet
            }
        }
    }
    
    // If we got here, all cells are filled and there's no winner (already checked in handleClick)
    return true;
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

// Check if the main board is a draw
function checkMainBoardDraw() {
    // Check if any line (row, column, diagonal) can still be completed by either player
    const size = MAIN_BOARD_SIZE;
    
    // Helper function to check if a position is available (not won by opponent)
    const isAvailable = (row, col, player) => {
        return mainBoard[row][col].winner !== getOpponent(player) && !mainBoard[row][col].isDraw;
    };
    
    // Helper function to get opponent
    const getOpponent = (player) => {
        return player === "X" ? "O" : "X";
    };
    
    // Check if any player can still win
    const canPlayerWin = (player) => {
        // Check rows
        for (let i = 0; i < size; i++) {
            if (isAvailable(i, 0, player) && isAvailable(i, 1, player) && isAvailable(i, 2, player)) {
                // Check if row is not already blocked by drawn boards
                const drawnCount = [0, 1, 2].filter(j => mainBoard[i][j].isDraw).length;
                const wonCount = [0, 1, 2].filter(j => mainBoard[i][j].winner === player).length;
                if (drawnCount + wonCount < 3) return true;
            }
        }
        
        // Check columns
        for (let j = 0; j < size; j++) {
            if (isAvailable(0, j, player) && isAvailable(1, j, player) && isAvailable(2, j, player)) {
                // Check if column is not already blocked by drawn boards
                const drawnCount = [0, 1, 2].filter(i => mainBoard[i][j].isDraw).length;
                const wonCount = [0, 1, 2].filter(i => mainBoard[i][j].winner === player).length;
                if (drawnCount + wonCount < 3) return true;
            }
        }
        
        // Check diagonals
        if (isAvailable(0, 0, player) && isAvailable(1, 1, player) && isAvailable(2, 2, player)) {
            const drawnCount = [0, 1, 2].filter(i => mainBoard[i][i].isDraw).length;
            const wonCount = [0, 1, 2].filter(i => mainBoard[i][i].winner === player).length;
            if (drawnCount + wonCount < 3) return true;
        }
        
        if (isAvailable(0, 2, player) && isAvailable(1, 1, player) && isAvailable(2, 0, player)) {
            const drawnCount = [0, 1, 2].filter(i => mainBoard[i][2-i].isDraw).length;
            const wonCount = [0, 1, 2].filter(i => mainBoard[i][2-i].winner === player).length;
            if (drawnCount + wonCount < 3) return true;
        }
        
        return false;
    };
    
    // Check if there are any empty subboards left
    let allBoardsDecided = true;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (mainBoard[i][j].winner === null && !mainBoard[i][j].isDraw) {
                allBoardsDecided = false;
                break;
            }
        }
        if (!allBoardsDecided) break;
    }
    
    // If all boards are decided (won or drawn) and no player can win, it's a draw
    if (allBoardsDecided) return true;
    
    // If neither player can win anymore, it's a draw
    return !canPlayerWin("X") && !canPlayerWin("O");
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
            // If the subboard is a draw, draw the draw indicator
            else if (mainBoard[i][j].isDraw) {
                drawSubBoardDraw(i, j);
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

// Draw a draw indicator over a subboard
function drawSubBoardDraw(mainRow, mainCol) {
    const x = GAME_OFFSET_X + mainCol * BOARD_SIZE;
    const y = GAME_OFFSET_Y + mainRow * BOARD_SIZE;
    
    // Semi-transparent gray overlay for draw
    context.fillStyle = DRAW_COLOR;
    context.fillRect(x, y, BOARD_SIZE, BOARD_SIZE);
    
    // Draw a hash/grid pattern to indicate a draw
    context.strokeStyle = TEXT_COLOR;
    context.lineWidth = 2;
    
    const padding = BOARD_SIZE * 0.2;
    const innerSize = BOARD_SIZE - (padding * 2);
    
    // Draw a grid/hash symbol
    const gridSize = 3;
    const gridStep = innerSize / gridSize;
    
    // Draw vertical grid lines
    for (let i = 1; i < gridSize; i++) {
        context.beginPath();
        context.moveTo(x + padding + i * gridStep, y + padding);
        context.lineTo(x + padding + i * gridStep, y + padding + innerSize);
        context.stroke();
    }
    
    // Draw horizontal grid lines
    for (let i = 1; i < gridSize; i++) {
        context.beginPath();
        context.moveTo(x + padding, y + padding + i * gridStep);
        context.lineTo(x + padding + innerSize, y + padding + i * gridStep);
        context.stroke();
    }
}

// Update the info panel - simplified to only show current player and active board
function updateInfo() {
    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(INFO_OFFSET_X, GAME_OFFSET_Y, INFO_WIDTH, GAME_HEIGHT);
    
    // Player turn indicator - larger and more prominent
    context.font = "32px Arial";
    context.textAlign = "center";
    context.fillStyle = TEXT_COLOR;
    context.fillText("Current Player", INFO_OFFSET_X + INFO_WIDTH / 2, GAME_OFFSET_Y + 180);
    
    // Draw rounded rectangle card for player symbol
    const cardX = INFO_OFFSET_X + 20;
    const cardY = GAME_OFFSET_Y + 200;
    const cardWidth = INFO_WIDTH - 40;
    const cardHeight = 200;
    const cardRadius = 15;
    
    // Add player background card with color (darker for dark mode)
    if (currentPlayer === "X") {
        // Blue card background for X
        context.fillStyle = "rgba(79, 142, 247, 0.15)";
    } else {
        // Red card background for O
        context.fillStyle = "rgba(247, 110, 110, 0.15)";
    }
    
    // Draw card background
    context.beginPath();
    context.roundRect(cardX, cardY, cardWidth, cardHeight, [cardRadius]);
    context.fill();
    
    // Add border to card
    context.strokeStyle = currentPlayer === "X" ? "rgba(79, 142, 247, 0.5)" : "rgba(247, 110, 110, 0.5)";
    context.lineWidth = 3;
    context.stroke();
    
    // Draw player symbol centered in the card
    const centerX = cardX + cardWidth / 2;
    const centerY = cardY + cardHeight / 2;
    const symbolSize = 150; // Slightly smaller for better centering
    
    if (currentPlayer === "X") {
        context.fillStyle = PLAYER_X_COLOR;
        context.font = `${symbolSize}px Arial`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("X", centerX, centerY);
    } else {
        context.fillStyle = PLAYER_O_COLOR;
        context.font = `${symbolSize}px Arial`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("O", centerX, centerY);
    }
    
    // Reset text baseline for remaining text
    context.textBaseline = "alphabetic";
    
    // Show active board indicator at the bottom of the info panel
    context.fillStyle = TEXT_COLOR;
    context.font = "24px Arial";
    context.textAlign = "center";
    
    if (activeBoard === null) {
        context.fillText("Any board is active", INFO_OFFSET_X + INFO_WIDTH / 2, GAME_OFFSET_Y + GAME_HEIGHT - 100);
    } else {
        context.fillText(`Active: R${activeBoard.row + 1}, C${activeBoard.col + 1}`, 
                       INFO_OFFSET_X + INFO_WIDTH / 2, GAME_OFFSET_Y + GAME_HEIGHT - 100);
    }
    
    // If game is over, show simple game over message
    if (gameOver) {
        context.fillStyle = TEXT_COLOR;
        context.font = "24px Arial";
        context.textAlign = "center";
        
        if (winner === "Draw") {
            context.fillText("Game Over - Draw", INFO_OFFSET_X + INFO_WIDTH / 2, GAME_OFFSET_Y + GAME_HEIGHT - 50);
        } else {
            context.fillStyle = winner === "X" ? PLAYER_X_COLOR : PLAYER_O_COLOR;
            context.fillText(`Player ${winner} Wins!`, INFO_OFFSET_X + INFO_WIDTH / 2, GAME_OFFSET_Y + GAME_HEIGHT - 50);
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
        
        // Play win sound when showing the game over screen
        winSound.play();
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
            mainBoard[i][j].isDraw = false; // Reset draw state
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