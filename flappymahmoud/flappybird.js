// flappybird.js

// ─── Board Setup ─────────────────────────────────────────────────────────────
let board;
const boardWidth  = 1080;
const boardHeight = 600;
let context;

// ─── Bird ────────────────────────────────────────────────────────────────────
const birdWidth  = 50;
const birdHeight = 30;
const birdX      = boardWidth / 8;
const birdY      = boardHeight / 2;

let bird = {
  x: birdX,
  y: birdY,
  width:  birdWidth,
  height: birdHeight
};

let birdImg;

// ─── Pipes ───────────────────────────────────────────────────────────────────
let pipeArray   = [];
const pipeWidth  = 64;
const pipeHeight = 512;
const pipeX      = boardWidth;
const pipeY      = 0;

// ─── Physics & Game State ────────────────────────────────────────────────────
let velocityX = -2;  // pipes move left
let velocityY = 0;   // bird’s vertical speed
const gravity   = 0.1;

let gameOver = false;
let score    = 0;
let highscore = 0;

// ─── Sounds ──────────────────────────────────────────────────────────────────
const falloff   = new Audio("./sfx_die.wav");
const hitpipe   = new Audio("./sfx_hit.wav");
const scoreplus = new Audio("./sfx_point.wav");
const wingflap  = new Audio("./sfx_wing.wav");

// ─── Entry Point ──────────────────────────────────────────────────────────────
window.onload = function() {
  // canvas init
  board       = document.getElementById("board");
  board.width = boardWidth;
  board.height= boardHeight;
  context     = board.getContext("2d");

  // load bird image
  birdImg = new Image();
  birdImg.src = "./human.png";

  // load pipes
  topPipeImg    = new Image(); topPipeImg.src    = "./toppipe.png";
  bottomPipeImg = new Image(); bottomPipeImg.src = "./bottompipe.png";

  // start loops
  requestAnimationFrame(update);
  setInterval(placePipes, 1500);

  // ─── prevent page scroll on space & arrows ────────────────────────────────
  document.addEventListener("keydown", function(e) {
    if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) {
      e.preventDefault();
    }
  });

  // space to jump or restart
  document.addEventListener("keydown", moveBird);
};

// ─── Main Render Loop ────────────────────────────────────────────────────────
function update() {
  requestAnimationFrame(update);
  if (gameOver) return;

  // clear
  context.clearRect(0, 0, boardWidth, boardHeight);

  // apply gravity
  velocityY += gravity;
  velocityY *= 0.99;
  bird.y = Math.max(bird.y + velocityY, 0);

  // draw bird
  context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  // hit ground?
  if (bird.y > boardHeight - bird.height) {
    falloff.play();
    gameOver = true;
  }

  // move & draw pipes
  pipeArray.forEach(pipe => {
    pipe.x += velocityX;
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

    // scoring
    if (!pipe.passed && bird.x > pipe.x) {
      scoreplus.play();
      score += 0.5; // two pipes = 1 point
      document.getElementById("score").innerText = score;
      if (score > highscore) {
        highscore = score;
        document.getElementById("high-score").innerText = highscore;
      }
      pipe.passed = true;
    }

    // collision?
    if (detectCollision(bird, pipe)) {
      hitpipe.play();
      gameOver = true;
    }
  });

  // cleanup off-screen pipes
  while (pipeArray.length && pipeArray[0].x < -pipeWidth) {
    pipeArray.shift();
  }

  // game-over display
  if (gameOver) {
    context.fillStyle = "red";
    context.font      = "bold 60px sans-serif";
    context.fillText("GAME OVER!", (boardWidth/2) - 180, boardHeight/2);
    context.fillStyle = "black";
    context.font      = "20px sans-serif";
    context.fillText("Press Space to restart",
                     (boardWidth/2) - 110,
                     boardHeight/2 + 40);
  }
}

// ─── Spawn Pipes ─────────────────────────────────────────────────────────────
function placePipes() {
  if (gameOver) return;

  const openingSpace = boardHeight / 4;
  const randomPipeY  = pipeY - pipeHeight/4 - Math.random() * (pipeHeight/2);

  // top
  pipeArray.push({
    img: topPipeImg,
    x:   pipeX,
    y:   randomPipeY,
    width:  pipeWidth,
    height: pipeHeight,
    passed: false
  });

  // bottom
  pipeArray.push({
    img: bottomPipeImg,
    x:   pipeX,
    y:   randomPipeY + pipeHeight + openingSpace,
    width:  pipeWidth,
    height: pipeHeight,
    passed: false
  });
}

// ─── Input: Jump & Restart ───────────────────────────────────────────────────
function moveBird(e) {
  if (e.code !== "Space") return;

  if (gameOver) {
    // reset state
    bird.y      = birdY;
    velocityY   = 0;
    pipeArray   = [];
    score       = 0;
    document.getElementById("score").innerText = score;
    gameOver    = false;
  } else {
    // jump
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
