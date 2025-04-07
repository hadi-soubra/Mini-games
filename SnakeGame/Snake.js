
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

    const startBtn = document.getElementById("startBtn");
    const restartBtn = document.getElementById("restartBtn");
    const scoreDisplay = document.getElementById("scoreDisplay");

    startBtn.onclick = () => startGame();
    restartBtn.onclick = () => restartGame();

    document.addEventListener("keydown", (event) => {
      if (!isGameRunning && direction === null) {
        isGameRunning = true;
        game = setInterval(draw, 100);
      }

      if (event.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
      else if (event.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
      else if (event.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
      else if (event.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
    });

    function startGame() {
      snake = [{ x: 200, y: 200 }];
      direction = null; // Still at start
      isGameRunning = false;
      score = 0;
      updateScore();
      placeFood();
      draw(); // Draw the initial still frame
      startBtn.disabled = true;
      restartBtn.disabled = false;
    }

    function restartGame() {
      clearInterval(game);
      startGame();
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

      // Draw snake
      for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? "lime" : "lightgreen";
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
      }

      // Draw food
      ctx.fillStyle = "red";
      ctx.fillRect(food.x, food.y, box, box);

      if (!direction) return; // Snake stays still until arrow key is pressed

      // Move
      let head = { ...snake[0] };
      if (direction === "UP") head.y -= box;
      if (direction === "DOWN") head.y += box;
      if (direction === "LEFT") head.x -= box;
      if (direction === "RIGHT") head.x += box;

      // Game over check
      if (
        head.x < 0 || head.x >= canvasSize ||
        head.y < 0 || head.y >= canvasSize ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)
      ) {
        clearInterval(game);
        alert("Game Over! Your score: " + score);
        startBtn.disabled = false;
        restartBtn.disabled = true;
        direction = null;
        isGameRunning = false;
        return;
      }

      snake.unshift(head);

      // Eat or move
      if (head.x === food.x && head.y === food.y) {
        score++;
        updateScore();
        placeFood();
      } else {
        snake.pop();
      }
    }
 