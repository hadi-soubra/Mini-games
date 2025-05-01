// Snake.js

// ─── Configuration ────────────────────────────────────────────────────────────
const GAME_NAME  = 'Snake';    // must match your back-end game_name
const blockSize  = 40;
const rows       = 15;
const cols       = 27;
let   gameSpeed  = 100;

// ─── State & DOM refs ────────────────────────────────────────────────────────
let board, context, boardWidth, boardHeight, gameInterval;
let snakeX = blockSize * 5, snakeY = blockSize * 5;
let velocityX = 0, velocityY = 0;
let snakeBody = [], foodX, foodY;
let gameOver = false;
let score = 0, highscore = 0, sentScore = false;

let scoreEl, highScoreEl, favButton, leaderboardEl;

// ─── Audio & Image Assets ────────────────────────────────────────────────────
const moveSound     = new Audio('move.mp3');
const foodSound     = new Audio('food.mp3');
const gameoverSound = new Audio('gameover.mp3');
const snakeHeadImg  = new Image();
snakeHeadImg.src    = 'snake-head.png';

// ─── Persistence Helpers ──────────────────────────────────────────────────────

// Submit a new score; backend updates high_scores and returns the updated highscore.
function submitHighScore(finalScore) {
  return fetch('/submit_score', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `game=${encodeURIComponent(GAME_NAME)}&score=${finalScore}`
  })
  .then(r => r.json())
  .then(data => {
    if (data.status === 'ok') {
      highscore = data.highscore;
      highScoreEl.innerText = highscore;
      // Refresh the leaderboard whenever a new high score is recorded
      loadLeaderboard();
    } else {
      console.error('Unexpected response:', data);
    }
  })
  .catch(err => console.error('Error saving high score:', err));
}

// Fetch the logged-in user’s stored highscore for this game
function initHighScore() {
  fetch(`/get_highscore?game=${encodeURIComponent(GAME_NAME)}`, {
    credentials: 'same-origin'
  })
    .then(r => r.json())
    .then(data => {
      highscore = data.highscore;
      highScoreEl.innerText = highscore;
    })
    .catch(err => console.error('Error fetching high score:', err));
}

// Fetch top-10 high scores across all users and render the leaderboard
function loadLeaderboard() {
  fetch(`/leaderboard?game=${encodeURIComponent(GAME_NAME)}&top=10`, {
    credentials: 'same-origin'
  })
    .then(r => r.json())
    .then(list => {
      leaderboardEl.innerHTML = '';
      list.forEach(entry => {
        const li = document.createElement('li');
        const userSpan = document.createElement('span');
        userSpan.className = 'username';
        userSpan.textContent = entry.username;
        
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'score';
        scoreSpan.textContent = entry.highscore;
        
        li.append(userSpan, scoreSpan);
        leaderboardEl.appendChild(li);
        
      });
    })
    .catch(err => console.error('Error loading leaderboard:', err));
}

// ─── Favorites Helpers ───────────────────────────────────────────────────────

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
  const url   = isFav ? '/unfavorite' : '/favorite';
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

// ─── Entry Point ─────────────────────────────────────────────────────────────

window.onload = () => {
  // Canvas setup
  board        = document.getElementById('board');
  board.width  = cols * blockSize;
  board.height = rows * blockSize;
  boardWidth   = board.width;
  boardHeight  = board.height;
  context      = board.getContext('2d');

  // DOM references
  scoreEl       = document.getElementById('score');
  highScoreEl   = document.getElementById('high-score');
  leaderboardEl = document.getElementById('leaderboard-list');

  // Initialize displays
  scoreEl.innerText     = score;
  highScoreEl.innerText = '…';

  // Load persisted data
  initHighScore();
  loadLeaderboard();
  initFavoriteButton();

  // Place the first food
  placeFood();

  // Prevent arrow keys from scrolling page
  document.addEventListener('keydown', e => {
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  });

  // Game controls
  document.addEventListener('keyup', handleKeyPress);

  // Start the game loop
  gameInterval = setInterval(update, gameSpeed);
};

// ─── Game Loop ───────────────────────────────────────────────────────────────

function update() {
  if (gameOver) return;

  // Draw background
  context.fillStyle = '#a4d03f';
  context.fillRect(0, 0, boardWidth, boardHeight);

  // Checkerboard effect
  context.fillStyle = '#9cc93a';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) {
        context.fillRect(c*blockSize, r*blockSize, blockSize, blockSize);
      }
    }
  }

  // Draw and handle food
  context.fillStyle = 'red';
  context.beginPath();
  context.arc(
    foodX + blockSize/2,
    foodY + blockSize/2,
    blockSize/2 - 2,
    0, 2*Math.PI
  );
  context.fill();

  if (snakeX === foodX && snakeY === foodY) {
    snakeBody.push([foodX, foodY]);
    placeFood();
    score++;
    scoreEl.innerText = score;
    foodSound.play();

    // Update local highscore display
    if (score > highscore) {
      highscore = score;
      highScoreEl.innerText = highscore;
    }

    // Speed up every 5 points
    if (score % 5 === 0 && gameSpeed > 50) {
      clearInterval(gameInterval);
      gameSpeed -= 5;
      gameInterval = setInterval(update, gameSpeed);
    }
  }

  // Move snake body
  for (let i = snakeBody.length - 1; i > 0; i--) {
    snakeBody[i] = snakeBody[i - 1];
  }
  if (snakeBody.length) {
    snakeBody[0] = [snakeX, snakeY];
  }

  // Compute next head position
  const nextX = snakeX + velocityX * blockSize;
  const nextY = snakeY + velocityY * blockSize;
  const hitWall = (
    nextX < 0 ||
    nextX >= boardWidth ||
    nextY < 0 ||
    nextY >= boardHeight
  );

  if (!hitWall) {
    snakeX = nextX;
    snakeY = nextY;
  }

  // Draw body segments
  context.fillStyle = '#4287f5';
  snakeBody.forEach(seg => {
    context.beginPath();
    context.roundRect(
      seg[0], seg[1],
      blockSize, blockSize,
      [blockSize/5]
    );
    context.fill();
  });

  // Draw head
  if (snakeHeadImg.complete) {
    context.drawImage(snakeHeadImg, snakeX, snakeY, blockSize, blockSize);
  } else {
    context.beginPath();
    context.roundRect(
      snakeX, snakeY,
      blockSize, blockSize,
      [blockSize/5]
    );
    context.fill();
  }

  // Check collisions
  if (
    hitWall ||
    snakeBody.some(seg => seg[0] === snakeX && seg[1] === snakeY)
  ) {
    gameoverSound.play();
    gameOverAction();
  }
}

// ─── Controls ────────────────────────────────────────────────────────────────

function handleKeyPress(e) {
  if (gameOver) {
    if (e.code === 'Space') restartGame();
    return;
  }
  if (e.code === 'ArrowUp'    && velocityY !== 1)    { velocityX=0; velocityY=-1; }
  if (e.code === 'ArrowDown'  && velocityY !== -1)   { velocityX=0; velocityY=1; }
  if (e.code === 'ArrowLeft'  && velocityX !== 1)    { velocityX=-1;velocityY=0; }
  if (e.code === 'ArrowRight' && velocityX !== -1)   { velocityX=1; velocityY=0; }
  moveSound.play();
}

// ─── Food Placement ──────────────────────────────────────────────────────────

function placeFood() {
  let valid = false;
  while (!valid) {
    foodX = Math.floor(Math.random() * cols) * blockSize;
    foodY = Math.floor(Math.random() * rows) * blockSize;
    valid = (
      (foodX !== snakeX || foodY !== snakeY) &&
      !snakeBody.some(seg => seg[0] === foodX && seg[1] === foodY)
    );
  }
}

// ─── Game Over & Restart ─────────────────────────────────────────────────────

function gameOverAction() {
  gameOver = true;
  clearInterval(gameInterval);

  // Submit only once per run
  if (!sentScore) {
    sentScore = true;
    submitHighScore(highscore);
  }

  // Draw "Game Over" text
  context.fillStyle = 'red';
  context.font      = 'bold 60px sans-serif';
  context.fillText(
    'GAME OVER!',
    boardWidth/2 - 180,
    boardHeight/2
  );
  context.fillStyle = 'black';
  context.font      = '20px sans-serif';
  context.fillText(
    'Press Space to restart',
    boardWidth/2 - 100,
    boardHeight/2 + 30
  );
}

function restartGame() {
  clearInterval(gameInterval);
  gameOver   = false;
  score      = 0;
  sentScore  = false;
  velocityX  = 0;
  velocityY  = 0;
  snakeX     = blockSize * 5;
  snakeY     = blockSize * 5;
  snakeBody  = [];
  scoreEl.innerText     = score;
  highScoreEl.innerText = highscore;
  placeFood();
  gameInterval = setInterval(update, gameSpeed);
}
