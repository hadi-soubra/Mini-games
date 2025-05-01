// flappybird.js

// ─── Configuration ────────────────────────────────────────────────────────────
const GAME_NAME  = 'Flappymhmoud';  // Must match your back-end game_name
const scoreEl     = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const leaderboardEl = document.getElementById('leaderboard-list');
let favButton;

// ─── Board Setup ─────────────────────────────────────────────────────────────
let board, context;
const boardWidth  = 1080;
const boardHeight = 600;

// ─── Bird ────────────────────────────────────────────────────────────────────
const birdWidth  = 50;
const birdHeight = 30;
const birdX      = boardWidth / 8;
const birdY      = boardHeight / 2;
let bird = { x: birdX, y: birdY, width: birdWidth, height: birdHeight };
let birdImg;

// ─── Pipes ───────────────────────────────────────────────────────────────────
let pipeArray   = [];
const pipeWidth  = 64;
const pipeHeight = 512;
const pipeX      = boardWidth;
const pipeY      = 0;
let topPipeImg, bottomPipeImg;

// ─── Physics & Game State ────────────────────────────────────────────────────
let velocityX = -2;
let velocityY = 0;
const gravity   = 0.1;
let gameOver   = false;
let score      = 0;
let highscore  = 0;
let sentScore  = false;  // ensure we only send once per run
<<<<<<< HEAD
let isLoggedIn = false;  // track login status
=======
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e

// ─── Sounds ──────────────────────────────────────────────────────────────────
const falloff   = new Audio('./sfx_die.wav');
const hitpipe   = new Audio('./sfx_hit.wav');
const scoreplus = new Audio('./sfx_point.wav');
const wingflap  = new Audio('./sfx_wing.wav');

// ─── Helper: Submit high score to server ─────────────────────────────────────
function submitHighScore(finalScore) {
<<<<<<< HEAD
  if (!isLoggedIn) {
    console.log('Not logged in, score not submitted');
    return Promise.resolve();
  }

=======
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e
  return fetch('/submit_score', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `game=${encodeURIComponent(GAME_NAME)}&score=${finalScore}`
  })
  .then(r => r.json())
  .then(data => {
    if (data.status === 'ok') {
      // Update local highscore and UI
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

// ─── Initialize & Fetch Stored High Score ────────────────────────────────────
function initHighScore() {
<<<<<<< HEAD
  // Show loading indicator
  highScoreEl.innerText = 'Loading...';
  
  // Don't fetch if not logged in
  if (!isLoggedIn) {
    highScoreEl.innerText = '0';
    return Promise.resolve();
  }

  return fetch(`/get_highscore?game=${encodeURIComponent(GAME_NAME)}`, {
=======
  fetch(`/get_highscore?game=${encodeURIComponent(GAME_NAME)}`, {
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e
    credentials: 'same-origin'
  })
    .then(r => r.json())
    .then(data => {
<<<<<<< HEAD
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
=======
      highscore = data.highscore;
      highScoreEl.innerText = highscore;
    })
    .catch(err => console.error('Error fetching high score:', err));
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e
}

// ─── Fetch top-10 high scores across all users and render the leaderboard ────
function loadLeaderboard() {
<<<<<<< HEAD
  return fetch(`/leaderboard?game=${encodeURIComponent(GAME_NAME)}&top=10`, {
=======
  fetch(`/leaderboard?game=${encodeURIComponent(GAME_NAME)}&top=10`, {
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e
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
<<<<<<< HEAD
=======
      
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e
    })
    .catch(err => console.error('Error loading leaderboard:', err));
}

// ─── Favorites Helpers ───────────────────────────────────────────────────────

// Initialize the favorites button state and click handler
function initFavoriteButton() {
  favButton = document.getElementById('fav-btn');
<<<<<<< HEAD
  
  // Don't initialize if not logged in
  if (!isLoggedIn) {
    favButton.disabled = true;
    favButton.innerText = 'Login to Add Favorites';
    return Promise.resolve();
  }

  return fetch('/my_favorites', { credentials: 'same-origin' })
=======
  fetch('/my_favorites', { credentials: 'same-origin' })
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e
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

<<<<<<< HEAD
// ─── Check Authentication Status ─────────────────────────────────────────────
function checkAuthStatus() {
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
      const favButton = document.getElementById('fav-btn');
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
  });
}

=======
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e
// ─── Entry Point ──────────────────────────────────────────────────────────────
window.onload = function() {
  // Canvas setup
  board       = document.getElementById('board');
  board.width = boardWidth;
  board.height= boardHeight;
  context     = board.getContext('2d');

  // Load assets
  birdImg        = new Image(); birdImg.src        = './human.png';
  topPipeImg     = new Image(); topPipeImg.src     = './toppipe.png';
  bottomPipeImg  = new Image(); bottomPipeImg.src  = './bottompipe.png';

  // Initialize displayed scores
<<<<<<< HEAD
  scoreEl.innerText = score;
  highScoreEl.innerText = 'Loading...';
  
  // Check auth status first, which will trigger high score loading if logged in
  checkAuthStatus()
    .then(() => {
      // Start game loops after auth check completes
      requestAnimationFrame(update);
      setInterval(placePipes, 1500);
    });
=======
  scoreEl.innerText     = score;
  highScoreEl.innerText = '…';
  
  // Load persisted data
  initHighScore();
  loadLeaderboard();
  initFavoriteButton();

  // Start loops
  requestAnimationFrame(update);
  setInterval(placePipes, 1500);
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e

  // Prevent page scroll on space & arrows
  document.addEventListener('keydown', e => {
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  });

  // Space: jump or restart
  document.addEventListener('keydown', moveBird);
};

// ─── Main Render Loop ────────────────────────────────────────────────────────
function update() {
  if (gameOver) return;
  requestAnimationFrame(update);

  // Clear board
  context.clearRect(0, 0, boardWidth, boardHeight);

<<<<<<< HEAD
  
=======
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e
  // Apply gravity
  velocityY += gravity;
  velocityY *= 0.99;
  bird.y = Math.max(bird.y + velocityY, 0);

  // Draw bird
  context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  // Ground collision
  if (bird.y > boardHeight - bird.height) {
    falloff.play();
    endGame();
  }

  // Move & draw pipes
  pipeArray.forEach(pipe => {
    pipe.x += velocityX;
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

    // Score when you pass a pipe
    if (!pipe.passed && bird.x > pipe.x) {
      scoreplus.play();
      score += 0.5;  // two pipes = 1 point
      scoreEl.innerText = Math.floor(score);
      if (score > highscore) {
        highscore = score;
        highScoreEl.innerText = Math.floor(highscore);
      }
      pipe.passed = true;
    }

    // Pipe collision
    if (detectCollision(bird, pipe)) {
      hitpipe.play();
      endGame();
    }
  });

  // Remove off-screen pipes
  if (pipeArray.length && pipeArray[0].x < -pipeWidth) {
    pipeArray.shift();
    pipeArray.shift();
  }

  // Game over message
  if (gameOver) {
    context.fillStyle = 'red';
    context.font      = 'bold 60px sans-serif';
    context.fillText('GAME OVER!', (boardWidth/2)-180, boardHeight/2);
    context.fillStyle = 'black';
    context.font      = '20px sans-serif';
    context.fillText('Press Space to restart',
                     (boardWidth/2)-110,
                     boardHeight/2 + 40);
  }
}

// ─── End-of-Game Logic ───────────────────────────────────────────────────────
function endGame() {
<<<<<<< HEAD
  if (!sentScore && isLoggedIn) {
=======
  if (!sentScore) {
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e
    sentScore = true;
    // Submit the stored high score to the server
    submitHighScore(Math.floor(highscore));
  }
  gameOver = true;
}

// ─── Spawn Pipes ─────────────────────────────────────────────────────────────
function placePipes() {
  if (gameOver) return;
  const opening = boardHeight / 4;
  const randomY = pipeY - pipeHeight/4 - Math.random() * (pipeHeight/2);

  // Top pipe
  pipeArray.push({
    img: topPipeImg, x: pipeX, y: randomY,
    width: pipeWidth, height: pipeHeight, passed: false
  });
  // Bottom pipe
  pipeArray.push({
    img: bottomPipeImg, x: pipeX,
    y: randomY + pipeHeight + opening,
    width: pipeWidth, height: pipeHeight, passed: false
  });
}

// ─── Input: Jump & Restart ───────────────────────────────────────────────────
function moveBird(e) {
  if (e.code !== 'Space') return;

  if (gameOver) {
    // Reset state
    bird.y       = birdY;
    velocityY    = 0;
    pipeArray    = [];
    score        = 0;
    sentScore    = false;
    gameOver     = false;
    scoreEl.innerText     = score;
    highScoreEl.innerText = Math.floor(highscore);
    requestAnimationFrame(update);
  } else {
    wingflap.play();
    velocityY = -5;
  }
}

// ─── Collision Detection ─────────────────────────────────────────────────────
function detectCollision(a, b) {
  return  a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y;
}