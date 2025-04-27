// Snake.js

// ─── Game Configuration ─────────────────────────────────────────────────────
var blockSize   = 40;    // size of one snake segment
var rows        = 15;    // grid height = rows * blockSize = 600px
var cols        = 27;    // grid width  = cols * blockSize = 1080px
var gameSpeed   = 100;   // starting speed (ms per frame)

// ─── State Variables ────────────────────────────────────────────────────────
var board, context, boardWidth, boardHeight, gameInterval;
var snakeX = blockSize * 5, snakeY = blockSize * 5;
var velocityX = 0, velocityY = 0;
var snakeBody = [], foodX, foodY;
var gameOver = false;
var score = 0, highscore = 0;

// ─── Load Snake Head Image ───────────────────────────────────────────────────
var snakeHeadImg = new Image();
var headLoaded   = false;
snakeHeadImg.src = "snake-head.png";
snakeHeadImg.onload  = () => { headLoaded = true; };
snakeHeadImg.onerror = () => { console.error("Failed to load snake-head.png"); };

// ─── Entry Point ─────────────────────────────────────────────────────────────
window.onload = function() {
  // set up canvas
  board        = document.getElementById("board");
  board.width  = cols * blockSize;
  board.height = rows * blockSize;
  boardWidth   = board.width;
  boardHeight  = board.height;
  context      = board.getContext("2d");

  // place initial food
  placeFood();

  // prevent arrows + space from scrolling the page
  document.addEventListener("keydown", function(e) {
    if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) {
      e.preventDefault();
    }
  });

  // wire up your game’s key handler
  document.addEventListener("keyup", handleKeyPress);

  // start game loop
  gameInterval = setInterval(update, gameSpeed);
};

// ─── Input Handling ──────────────────────────────────────────────────────────
function handleKeyPress(e) {
  if (gameOver) {
    if (e.code === "Space") restartGame();
    return;
  }
  changeDirection(e);
}

// ─── Game Loop ───────────────────────────────────────────────────────────────
function update() {
  if (gameOver) return;

  // 1) Clear & draw background
  context.fillStyle = "#a4d03f";
  context.fillRect(0, 0, boardWidth, boardHeight);

  // 2) Optional checkerboard
  context.fillStyle = "#9cc93a";
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if ((i + j) % 2 === 0) {
        context.fillRect(j * blockSize, i * blockSize, blockSize, blockSize);
      }
    }
  }

  // 3) Draw food (red apple)
  context.fillStyle = "red";
  context.beginPath();
  context.arc(foodX + blockSize/2, foodY + blockSize/2, blockSize/2 - 2, 0, 2 * Math.PI);
  context.fill();
  // stem
  context.fillStyle = "brown";
  context.fillRect(foodX + blockSize/2 - 1, foodY + 2, 2, 4);
  // leaf
  context.fillStyle = "green";
  context.beginPath();
  context.ellipse(foodX + blockSize/2 + 3, foodY + 4, 3, 5, Math.PI/4, 0, 2 * Math.PI);
  context.fill();

  // 4) Eat food?
  if (snakeX === foodX && snakeY === foodY) {
    snakeBody.push([foodX, foodY]);
    placeFood();
    score++;
    document.getElementById("score").innerText = score;
    if (score > highscore) {
      highscore = score;
      document.getElementById("high-score").innerText = highscore;
    }
    // speed up every 5 points
    if (score % 5 === 0 && gameSpeed > 50) {
      clearInterval(gameInterval);
      gameSpeed -= 5;
      gameInterval = setInterval(update, gameSpeed);
    }
  }

  // 5) Move body segments
  for (let i = snakeBody.length - 1; i > 0; i--) {
    snakeBody[i] = snakeBody[i - 1];
  }
  if (snakeBody.length) snakeBody[0] = [snakeX, snakeY];

  // 6) Compute next head position
  const nextX = snakeX + velocityX * blockSize;
  const nextY = snakeY + velocityY * blockSize;
  const hitWall =
    nextX < 0 || nextX >= cols * blockSize ||
    nextY < 0 || nextY >= rows * blockSize;

  // only update head coords if not hitting wall (keeps last visible position)
  if (!hitWall) {
    snakeX = nextX;
    snakeY = nextY;
  }

  // 7) Draw body
  for (let seg of snakeBody) {
    context.fillStyle = "#4287f5";
    context.beginPath();
    context.roundRect(seg[0], seg[1], blockSize, blockSize, [blockSize/5]);
    context.fill();
  }

  // 8) Draw head (at last valid position)
  if (headLoaded) {
    context.drawImage(snakeHeadImg, snakeX, snakeY, blockSize, blockSize);
  } else {
    context.fillStyle = "#4287f5";
    context.beginPath();
    context.roundRect(snakeX, snakeY, blockSize, blockSize, [blockSize/5]);
    context.fill();
  }

  // 9) Handle wall collision now that snake is visible
  if (hitWall) {
    gameOverAction();
    return;
  }

  // 10) Check self-collision
  for (let seg of snakeBody) {
    if (snakeX === seg[0] && snakeY === seg[1]) {
      gameOverAction();
      break;
    }
  }
}

// ─── Direction & Restart ────────────────────────────────────────────────────
function changeDirection(e) {
  if (e.code === "ArrowUp"    && velocityY !== 1)    { velocityX = 0;  velocityY = -1; }
  else if (e.code === "ArrowDown"  && velocityY !== -1) { velocityX = 0;  velocityY = 1; }
  else if (e.code === "ArrowLeft"  && velocityX !== 1)  { velocityX = -1; velocityY = 0; }
  else if (e.code === "ArrowRight" && velocityX !== -1) { velocityX = 1;  velocityY = 0; }
}

function restartGame() {
  clearInterval(gameInterval);
  gameOver = false;
  score = 0;
  document.getElementById("score").innerText = score;
  snakeX    = blockSize * 5;
  snakeY    = blockSize * 5;
  velocityX = 0;
  velocityY = 0;
  snakeBody = [];
  placeFood();
  gameInterval = setInterval(update, gameSpeed);
}

// ─── Food Placement ─────────────────────────────────────────────────────────
function placeFood() {
  let valid = false;
  while (!valid) {
    foodX = Math.floor(Math.random() * cols) * blockSize;
    foodY = Math.floor(Math.random() * rows) * blockSize;
    valid = true;
    if (foodX === snakeX && foodY === snakeY) valid = false;
    for (let seg of snakeBody) {
      if (foodX === seg[0] && foodY === seg[1]) {
        valid = false;
        break;
      }
    }
  }
}

// ─── Game Over Display ──────────────────────────────────────────────────────
function gameOverAction() {
  gameOver = true;
  clearInterval(gameInterval);

  context.fillStyle = "red";
  context.font      = "bold 60px sans-serif";
  context.fillText("GAME OVER!", boardWidth/2 - 180, boardHeight/2);

  context.fillStyle = "black";
  context.font      = "20px sans-serif";
  context.fillText("Press Space to restart",
                   boardWidth/2 - 100,
                   boardHeight/2 + 30);
}
