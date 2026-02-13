// --- CONFIGURATION ---
const CONFIG = {
  bgSpeed: 1,
  gravity: 0.4,
  jumpStrength: -7,
  pipeGap: 180,
  pipeWidth: 60,
  pipeSpeed: 2,
  maxSpeedMultiplier: 2.5,
  stickersPerPage: 9,
};

// Reset l'inventaire au chargement de la page
localStorage.removeItem("pedriStickersCollected");
localStorage.removeItem("toothStickersCollected");

let lastTop = null;
let lastBottom = null;
let animationId;
let selectedBird = "bird1.png";
let speedMultiplier = 1;
let birdX, birdY, birdVelocity;
let bgX = 0;
let pipes, score, frameCount;
let gameRunning = false;
let bestScore = localStorage.getItem("bestScore") || 0;
let pedriStickers = 0;
let toothStickers = 0;
let lastPedriUnlock = -1;
let lastToothUnlock = -1;
let currentPage = 0;
let particles =[];
let isGameOver = false;

// --- SYSTÈME DE PARTICULES ---
class Particle {
  constructor(x, y, color, shape = 'circle') {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8;
    this.life = 1.0;
    this.decay = Math.random() * 0.015 + 0.01;
    this.size = Math.random() * 8 + 4;
    this.color = color;
    this.shape = shape; // 'circle', 'heart', or 'star'
    this.rotation = Math.random() * Math.PI * 2; // Rotation aléatoire
    this.rotationSpeed = (Math.random() - 0.5) * 0.2; // Vitesse de rotation
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravité
    this.life -= this.decay;
    this.rotation += this.rotationSpeed;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.shape === 'heart') {
      this.drawHeart(ctx);
    } else if (this.shape === 'star') {
      this.drawStar(ctx);
    } else {
      // Cercle par défaut
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawHeart(ctx) {
    const size = this.size;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    
    // Cœur en utilisant des courbes de Bézier
    ctx.moveTo(0, size / 4);
    ctx.bezierCurveTo(-size, -size / 2, -size, -size, 0, -size / 4);
    ctx.bezierCurveTo(size, -size, size, -size / 2, 0, size / 4);
    
    ctx.fill();
  }

  drawStar(ctx) {
    const size = this.size;
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size / 2;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / spikes) * i - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.fill();
  }

  isDead() {
    return this.life <= 0;
  }
}
// 💔 EXPLOSION DE COLLISION (Cœurs rouges)
function createCollisionExplosion(x, y, count = 25) {
  const colors = ['#e30938', '#e20062', '#c90d20', '#990000'];
  
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    particles.push(new Particle(x, y, color, 'heart'));
  }
}

// ⭐ EXPLOSION DE SUCCÈS (Étoiles dorées)
function createSuccessExplosion(x, y, count = 15) {
  const colors = ['#FFD700', '#FFA500', '#FFFF00', '#FF8C00', '#F4C430'];
  
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    particles.push(new Particle(x, y, color, 'star'));
  }
}

function updateParticles() {
  particles.forEach(p => p.update());
  particles = particles.filter(p => !p.isDead());
}

function drawParticles(ctx) {
  particles.forEach(p => p.draw(ctx));
}

function resetGame() {
  birdX = 50;
  birdY = 250;
  birdVelocity = 0;
  pipes = [];
  particles = [];
  score = 0;
  frameCount = 0;
  lastTop = null;
  lastBottom = null;
  lastPedriUnlock = -1;
  lastToothUnlock = -1;
  pedriStickers = 0;
  toothStickers = 0;
  speedMultiplier = 1;
  isGameOver = false;
  document.getElementById("scoreDisplayTop").innerText = "Score: 0";
}

function startGame() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  showScreen("gameCanvas");
  resetGame();
  
  birdX = canvas.width * 0.15; 
  birdY = canvas.height / 2;
  birdVelocity = CONFIG.jumpStrength;
  gameRunning = true;
  
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(update);
}

function restartGame() {
  startGame();
}

function update() {
  if (!gameRunning) return;

  bgX -= CONFIG.bgSpeed * speedMultiplier;
  if (bgX <= -canvas.width) bgX = 0;

  frameCount++;
  birdVelocity += CONFIG.gravity;
  birdY += birdVelocity;

  speedMultiplier = Math.min(speedMultiplier + 0.0005, CONFIG.maxSpeedMultiplier);

  handlePipesLogic();
  handleScoringLogic();
  updateParticles();
  draw();

  animationId = requestAnimationFrame(update);
}

function handlePipesLogic() {
  pipes.forEach(pipe => pipe.x -= CONFIG.pipeSpeed * speedMultiplier);

  const horizontalGap = (selectedSet === "strangerthings") ? 400 : 250;

  if (frameCount > 100 && (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - horizontalGap)) {
    const activeSet = obstacleSets[selectedSet]; 
    const canSpawnRare = Math.random() < 0.1; 

    let availableObstacles = canSpawnRare ? activeSet : activeSet.filter(o => o.type !== "rare");
    
    // Sécurité: toujours avoir au moins un obstacle
    if (availableObstacles.length === 0) {
      availableObstacles = activeSet;
    }

let topChoice, bottomChoice;

// Choisir le TOP (éviter le même que le dernier top)
if (availableObstacles.length > 1 && lastTop !== null) {
  do {
    topChoice = availableObstacles[Math.floor(Math.random() * availableObstacles.length)];
  } while (topChoice.type === lastTop);
} else {
  topChoice = availableObstacles[Math.floor(Math.random() * availableObstacles.length)];
}

// Choisir le BOTTOM (éviter le même que le dernier bottom ET différent du top actuel)
if (availableObstacles.length > 1) {
  do {
    bottomChoice = availableObstacles[Math.floor(Math.random() * availableObstacles.length)];
  } while (
    bottomChoice.src === topChoice.src || // Pas le même que le top
    (lastBottom !== null && bottomChoice.type === lastBottom) // Pas le même que le dernier bottom
  );
} else {
  bottomChoice = topChoice;
}

    lastTop = topChoice.type;
    lastBottom = bottomChoice.type;

    let tScale = topChoice.scale;
    let bScale = bottomChoice.scale;
    
    // Utiliser des images préchargées
    let tImg = new Image(); 
    tImg.src = topChoice.src;
    let bImg = new Image(); 
    bImg.src = bottomChoice.src;

    const minVerticalGap = (selectedSet === "strangerthings") ? 200 : 175;
    let totalHeight = (topChoice.h * tScale) + (bottomChoice.h * bScale);
    
    if (totalHeight > (canvas.height - minVerticalGap)) {
      let reductionFactor = (canvas.height - minVerticalGap) / totalHeight;
      tScale *= reductionFactor;
      bScale *= reductionFactor;
    }

    pipes.push({
      x: canvas.width,
      top: { img: tImg, scale: tScale, type: topChoice.type, w: topChoice.w, h: topChoice.h },
      bottom: { img: bImg, scale: bScale, type: bottomChoice.type, w: bottomChoice.w, h: bottomChoice.h },
      passed: false
    });
  }

  pipes.forEach(pipe => {
    const padding = 0.85; 
    const wt = (pipe.top.img.width * pipe.top.scale) * padding;
    const ht = (pipe.top.img.height * pipe.top.scale) * padding;
    const wb = (pipe.bottom.img.width * pipe.bottom.scale) * padding;
    const hb = (pipe.bottom.img.height * pipe.bottom.scale) * padding;

    const offsetT = ((pipe.top.img.width * pipe.top.scale) - wt) / 2;
    const offsetB = ((pipe.bottom.img.width * pipe.bottom.scale) - wb) / 2;

    if (birdX + 25 > pipe.x + offsetT && birdX + 5 < pipe.x + offsetT + wt && birdY + 5 < ht) {
      if (!isGameOver) {
        isGameOver = true;
        createCollisionExplosion(birdX + 15, birdY + 15, 30);
        playDeathSound();
      }
    }
    if (birdX + 25 > pipe.x + offsetB && birdX + 5 < pipe.x + offsetB + wb && birdY + 25 > canvas.height - hb) {
      if (!isGameOver) {
        isGameOver = true;
        createCollisionExplosion(birdX + 15, birdY + 15, 30);
        playDeathSound();
      }
    }
    if (birdY > canvas.height || birdY < -20) {
      if (!isGameOver) {
        isGameOver = true;
        createCollisionExplosion(birdX + 15, birdY + 15, 25);
        playDeathSound();
      }
    }
  });
}

function handleScoringLogic() {
  pipes.forEach(pipe => {
    if (!pipe.passed && pipe.x + CONFIG.pipeWidth < birdX) {
      score++;
      pipe.passed = true;
      createSuccessExplosion(birdX + 15, birdY + 15, 10); 
      document.getElementById("scoreDisplayTop").innerText = "Score: " + score;

      if (selectedBird === "bird1.png" && score % 8 === 0 && score !== lastPedriUnlock) {
        unlockSticker("Pedri", pedriStickerImgs);
        lastPedriUnlock = score;
      }
      if (selectedBird === "bird2.png" && score % 11 === 0 && score !== lastToothUnlock) {
        unlockSticker("Tooth", toothStickerImgs);
        lastToothUnlock = score;
      }
    }
  });
}

function unlockSticker(label, list) {
  const randomSticker = list[Math.floor(Math.random() * list.length)];
  let count = (label === "Pedri") ? ++pedriStickers : ++toothStickers;
  showStickerReward(count, label, randomSticker);
  addToInventory(label, randomSticker);
}

function addToInventory(label, src) {
  let key = label.toLowerCase() + "StickersCollected";
  let current = JSON.parse(localStorage.getItem(key)) || [];
  if (!current.includes(src)) {
    current.push(src);
    localStorage.setItem(key, JSON.stringify(current));
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawPipes();
  drawBird();
  drawParticles(ctx); 
}

function drawBackground() {
  ctx.drawImage(bgImg, Math.round(bgX), 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, Math.round(bgX + canvas.width), 0, canvas.width, canvas.height);
}

function drawBird() {
  ctx.save();
  
  ctx.translate(birdX + 15, birdY + 15);
  let rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, birdVelocity * 0.1));
  ctx.rotate(rotation);

  let isNearObstacle = false;
  const alertScale = 0.95;

  pipes.forEach(p => {
    const wt = p.top.img.width * p.top.scale;
    const ht = p.top.img.height * p.top.scale;
    const hb = p.bottom.img.height * p.bottom.scale;

    const pW = wt * alertScale;
    const pX = p.x + (wt - pW) / 2;
    
    if (birdX < pX + pW && birdX + 30 > pX) {
      if (birdY < ht + 20 || birdY + 30 > canvas.height - hb - 20) {
        isNearObstacle = true;
      }
    }
  });

  if (isNearObstacle) {
    ctx.shadowBlur = 30;
    ctx.shadowColor = "red";
    ctx.filter = "sepia(1) saturate(5) hue-rotate(-50deg)";
  }

  ctx.drawImage(birdImg, -15, -15, 30, 30);
  
  ctx.restore(); 
}

function drawPipes() {
  pipes.forEach(pipe => {
    ctx.save();
    
    let pulse = 10 + Math.sin(frameCount * 0.1) * 5; 
    ctx.shadowBlur = pulse; 
    ctx.shadowColor = "rgba(255, 0, 0, 0.8)";

    const wt = pipe.top.img.width * pipe.top.scale;
    const ht = pipe.top.img.height * pipe.top.scale;
    const wb = pipe.bottom.img.width * pipe.bottom.scale;
    const hb = pipe.bottom.img.height * pipe.bottom.scale;
    
    ctx.drawImage(pipe.bottom.img, pipe.x, canvas.height - hb, wb, hb);

    ctx.translate(pipe.x + wt / 2, ht);
    ctx.scale(1, -1);
    ctx.drawImage(pipe.top.img, -wt / 2, 0, wt, ht);
    ctx.restore();
  });
}

function playDeathSound() {
  flapSound.pause();
  flapSound.currentTime = 0;
  deathSound.currentTime = 0;
  
  deathSound.play().then(() => {
    setTimeout(() => endGame(), 500);
  }).catch(e => {
    // Si le son ne peut pas jouer, on termine quand même le jeu
    setTimeout(() => endGame(), 300);
  });
}

function endGame() {
  gameRunning = false;
  showScreen("gameOverScreen");
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("bestScore", bestScore);
  }
  document.getElementById("scoreDisplay").innerText = "Ton Score: " + score;
  document.getElementById("bestScoreDisplay").innerText = "Meilleur Score: " + bestScore;
}

function showStickerReward(count, label, src) {
  const container = document.createElement("div");
  container.className = "stickerReward";
  container.innerHTML = `<div class="stickerMessage">${count} ${label}!!</div><img src="${src}" class="stickerUnlock">`;
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 2500);
}

function showInventory() {
  document.getElementById("gameOverScreen").style.display = "none";
  document.getElementById("inventoryScreen").style.display = "block";
  currentPage = 0;
  renderInventoryPage();
}

function renderInventoryPage() {
  const gallery = document.getElementById("inventoryGallery");
  gallery.innerHTML = "";
  const allStickers = [];
  
  ["pedri", "tooth"].forEach(l => {
    const s = JSON.parse(localStorage.getItem(l + "StickersCollected")) || [];
    s.forEach(src => allStickers.push(src));
  });

  const totalPages = Math.ceil(allStickers.length / CONFIG.stickersPerPage);
  const start = currentPage * CONFIG.stickersPerPage;
  const pageStickers = allStickers.slice(start, start + CONFIG.stickersPerPage);

  pageStickers.forEach(src => {
    const img = new Image();
    img.className = "gallerySticker";
    img.src = src;
    img.onclick = () => showStickerModal(src);
    gallery.appendChild(img);
  });
  
  updatePaginationControls(allStickers.length, totalPages);
}

function updatePaginationControls(totalItems, totalPages) {
  const controls = document.getElementById("paginationControls");
  controls.innerHTML = `<div class="pageIndicator">Page ${currentPage + 1} sur ${totalPages || 1}</div>`;
  
  if (currentPage > 0) {
    const b = document.createElement("button"); 
    b.innerText = "Précédent"; 
    b.className = "pageBtn";
    b.onclick = () => { currentPage--; renderInventoryPage(); };
    controls.appendChild(b);
  }
  
  if ((currentPage + 1) < totalPages) {
    const b = document.createElement("button"); 
    b.innerText = "Suivant"; 
    b.className = "pageBtn";
    b.onclick = () => { currentPage++; renderInventoryPage(); };
    controls.appendChild(b);
  }
}

function showStickerModal(src) {
  const m = document.createElement("div"); 
  m.className = "stickerModal";
  m.innerHTML = `<img src="${src}" class="bigSticker">`;
  m.onclick = () => m.remove();
  document.body.appendChild(m);
}
