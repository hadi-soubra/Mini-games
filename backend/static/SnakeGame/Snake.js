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
let isLoggedIn = false;  // track login status

let scoreEl, highScoreEl, favButton, leaderboardEl;

let headOptions;

// ─── Audio & Image Assets ────────────────────────────────────────────────────
const moveSound     = new Audio('move.mp3');
const foodSound     = new Audio('food.mp3');
const gameoverSound = new Audio('gameover.mp3');
const snakeHeadImg  = new Image();
snakeHeadImg.src    = 'snake-head1.png';
const foodImg = new Image();
foodImg.src = 'apple.png';  // Replace with your image filename

//----head options-------------------
function initHeadOptions() {
  headOptions = document.querySelectorAll('.head-option');
  
  headOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remove selected class from all options
      headOptions.forEach(opt => opt.classList.remove('selected'));
      
      // Add selected class to clicked option
      option.classList.add('selected');
      
      // Update the snake head image
      snakeHeadImg.src = option.dataset.image;
    });
  });
}

// ─── Check Authentication Status ─────────────────────────────────────────────
function checkAuthStatus() {
  // Initialize DOM references first to avoid undefined issues
  favButton = document.getElementById('fav-btn');

  return fetch('/check_auth', {
    credentials: 'same-origin'
  })
  .then(r => r.json())
  .then(data => {
    isLoggedIn = data.authenticated;
    
    if (isLoggedIn) {
      console.log(`User is authenticated as: ${data.username}`);
      
      // Update account icon if element exists
      const accountIcon = document.getElementById('account-icon');
      if (accountIcon) {
        accountIcon.textContent = `👤 ${data.username}`;
      }
      
      // Now that we know the user is logged in, we can load their data
      return Promise.all([
        initHighScore(),
        loadLeaderboard(),
        initFavoriteButton()
      ]);
    } else {
      console.log('User not logged in');
      
      // Initialize UI for non-logged in state
      highScoreEl.innerText = '0';
      loadLeaderboard(); // We still load leaderboard for non-logged in users
      
      // Handle favorite button for non-logged in users
      if (favButton) {
        favButton.disabled = true;
        favButton.innerText = 'Login to Add Favorites';
      }
    }
  })
  .catch(err => {
    console.error('Error checking auth status:', err);
    // Handle error gracefully
    highScoreEl.innerText = '0';
    loadLeaderboard();
    
    // Make sure we handle the favorite button even in error cases
    if (favButton) {
      favButton.disabled = true;
      favButton.innerText = 'Login to Add Favorites';
    }
  });
}

// ─── Persistence Helpers ──────────────────────────────────────────────────────

// Submit a new score; backend updates high_scores and returns the updated highscore.
function submitHighScore(finalScore) {
  if (!isLoggedIn) {
    console.log('Not logged in, score not submitted');
    return Promise.resolve();
  }

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
      console.log(`High score for ${GAME_NAME} is now ${highscore}`);
      // Refresh the leaderboard whenever a new high score is recorded
      loadLeaderboard();
    } else {
      console.error('Unexpected response:', data);
    }
  })
  .catch(err => console.error('Error saving high score:', err));
}

// Fetch the logged-in user's stored highscore for this game
function initHighScore() {
  // Show loading indicator
  highScoreEl.innerText = 'Loading...';
  
  // Don't fetch if not logged in
  if (!isLoggedIn) {
    highScoreEl.innerText = '0';
    return Promise.resolve();
  }

  return fetch(`/get_highscore?game=${encodeURIComponent(GAME_NAME)}`, {
    credentials: 'same-origin'
  })
    .then(r => r.json())
    .then(data => {
      if (data.highscore !== undefined) {
        highscore = data.highscore;
        highScoreEl.innerText = highscore;
        console.log(`Loaded high score: ${highscore}`);
      } else {
        highScoreEl.innerText = '0';
        console.log('No high score found');
      }
    })
    .catch(err => {
      console.error('Error fetching high score:', err);
      highScoreEl.innerText = '0';
    });
}

// Fetch top-10 high scores across all users and render the leaderboard
function loadLeaderboard() {
  return fetch(`/leaderboard?game=${encodeURIComponent(GAME_NAME)}&top=10`, {
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
  // No need to query for favButton again since we already did in checkAuthStatus
  
  // Don't initialize if not logged in
  if (!isLoggedIn) {
    // We also don't need this code here since it's handled in checkAuthStatus
    return Promise.resolve();
  }

  return fetch('/my_favorites', { credentials: 'same-origin' })
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
  highScoreEl.innerText = 'Loading...';

  // Check auth status first, which will trigger high score and favorites loading if logged in
  checkAuthStatus()
    .then(() => {
      // Initialize head options
      initHeadOptions();
      
      // Initialize snake with 2 body segments
      initSnake();
      
      // Place the first food after auth check completes
      placeFood();
      
      // Start with a slight delay to ensure proper initialization
      setTimeout(() => {
        gameInterval = setInterval(update, gameSpeed);
      }, 500);
    });

  // Prevent arrow keys from scrolling page
  document.addEventListener('keydown', e => {
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  });

  // Game controls
  document.addEventListener('keyup', handleKeyPress);
};

// Initialize snake with starting body segments
function initSnake() {
  // Clear snake body
  snakeBody = [];
  // Add two initial body segments (these will be properly positioned on the first update)
  // We need to offset them significantly to prevent immediate collision detection
  snakeBody.push([snakeX - blockSize * 3, snakeY]);
  snakeBody.push([snakeX - blockSize * 4, snakeY]);
}

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
if (foodImg.complete) {
  // Draw food image if loaded
  context.drawImage(foodImg, foodX, foodY, blockSize, blockSize);
} else {
  // Fallback to circle if image isn't loaded
  context.fillStyle = 'red';
  context.beginPath();
  context.arc(
    foodX + blockSize/2,
    foodY + blockSize/2,
    blockSize/2 - 2,
    0, 2*Math.PI
  );
  context.fill();
}

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
  let nextX = snakeX + velocityX * blockSize;
  let nextY = snakeY + velocityY * blockSize;
  
  // Handle wraparound (pass through walls)
  if (nextX < 0) {
    nextX = boardWidth - blockSize;
  } else if (nextX >= boardWidth) {
    nextX = 0;
  }
  
  if (nextY < 0) {
    nextY = boardHeight - blockSize;
  } else if (nextY >= boardHeight) {
    nextY = 0;
  }
  
  // Update snake head position
  snakeX = nextX;
  snakeY = nextY;

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

  // Check only for body collision (no wall collision anymore)
  // Only check for collision if the snake is actually moving
  if (velocityX !== 0 || velocityY !== 0) {
    if (snakeBody.some(seg => seg[0] === snakeX && seg[1] === snakeY)) {
      gameoverSound.play();
      gameOverAction();
    }
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

  // Submit only once per run and only if logged in
  if (!sentScore && isLoggedIn) {
    sentScore = true;
    submitHighScore(score);
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
  
  // Initialize snake with 2 body segments again
  initSnake();
  
  scoreEl.innerText     = score;
  highScoreEl.innerText = highscore;
  placeFood();
  gameInterval = setInterval(update, gameSpeed);
}