const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const box = 20;
const canvasSize = 600;
let snake = [];
let direction = null; // Snake starts still
let food;
let score = 0;
let game;
let isGameRunning = false;
let gameOver = false;

const scoreDisplay = document.getElementById("scoreDisplay");

// Listen for arrow key presses to start, control, or restart the game
document.addEventListener("keydown", (event) => {
  // If the game is not running, either start a new game or reset if game over
  if (!isGameRunning) {
    if (gameOver) {
      resetGame();
    } else {
      isGameRunning = true;
      game = setInterval(draw, 100);
    }
  }
  
  // Update direction if valid (prevent direct reversal)
  if (event.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (event.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
  else if (event.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (event.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
});

function resetGame() {
  clearInterval(game);
  snake = [{ x: 200, y: 200 }];
  direction = null;
  isGameRunning = false;
  gameOver = false;
  score = 0;
  updateScore();
  placeFood();
  draw(); // Draw the initial state
}

function updateScore() {
  scoreDisplay.textContent = "Score: " + score;
}

function placeFood() {
  food = {
    x: Math.floor(Math.random() * (canvasSize / box)) * box,
    y: Math.floor(Math.random() * (canvasSize / box)) * box
  };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the snake
  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i === 0 ? "lime" : "lightgreen";
    ctx.fillRect(snake[i].x, snake[i].y, box, box);
  }

  // Draw the food
  ctx.fillStyle = "red";
  ctx.fillRect(food.x, food.y, box, box);

  // If no direction has been pressed yet, don't move the snake
  if (!direction) return;

  // Move snake: Create new head based on direction
  let head = { ...snake[0] };
  if (direction === "UP") head.y -= box;
  if (direction === "DOWN") head.y += box;
  if (direction === "LEFT") head.x -= box;
  if (direction === "RIGHT") head.x += box;

  // Check for collisions (walls or self)
  if (
    head.x < 0 || head.x >= canvasSize ||
    head.y < 0 || head.y >= canvasSize ||
    snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    clearInterval(game);
    alert("Game Over! Your score: " + score);
    direction = null;
    isGameRunning = false;
    gameOver = true;
    return;
  }

  // Add new head to the snake
  snake.unshift(head);

  // If the snake eats the food, increase score and place new food;
  // otherwise, remove the tail segment
  if (head.x === food.x && head.y === food.y) {
    score++;
    updateScore();
    placeFood();
  } else {
    snake.pop();
  }
}
