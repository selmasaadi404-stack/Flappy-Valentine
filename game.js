// --- CONFIGURATION ---
const CONFIG = {
  bgSpeed: 1,
  gravity: 0.4,
  jumpStrength: -7,
  pipeGap: 180,
  pipeWidth: 60,
  pipeSpeed: 2,
  maxSpeedMultiplier: 2.5,
  stickersPerPage: 9, // Grille 3x3
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

function resetGame() {
  birdX = 50;
  birdY = 250;
  birdVelocity = 0;
  pipes = [];
  score = 0;
  frameCount = 0;
  lastPedriUnlock = -1;
  lastToothUnlock = -1;
  pedriStickers = 0;
  toothStickers = 0;
  speedMultiplier = 1;
  document.getElementById("scoreDisplayTop").innerText = "Score: 0";
}

function startGame() {
  // Ajuste la taille interne du canvas à la taille de l'écran
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  showScreen("gameCanvas");
  resetGame();
  
  // On ajuste la position X de l'oiseau selon la largeur
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

  // --- LOGIQUE ---
  bgX -= CONFIG.bgSpeed * speedMultiplier;
  if (bgX <= -canvas.width) bgX = 0;

  frameCount++;
  birdVelocity += CONFIG.gravity;
  birdY += birdVelocity;

  // Augmentation progressive de la vitesse
  speedMultiplier = Math.min(speedMultiplier + 0.0005, CONFIG.maxSpeedMultiplier);

  handlePipesLogic();
  handleScoringLogic();

  // --- DESSIN ---
  draw();

  animationId = requestAnimationFrame(update);
}

function handlePipesLogic() {
  pipes.forEach(pipe => pipe.x -= CONFIG.pipeSpeed * speedMultiplier);

  if (frameCount > 100 && (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200)) {
    const currentSet = obstacleSets[selectedSet];
    
    // Logique pour l'obstacle rare (ex: 10% de chance)
    let choice;
    const isRare = Math.random() < 0.1; // 0.1 = 10%
    
    if (isRare) {
        choice = currentSet.find(o => o.type === "rare") || currentSet[0];
    } else {
        // Exclure le rare du tirage normal
        const normalObstacles = currentSet.filter(o => o.type !== "rare");
        choice = normalObstacles[Math.floor(Math.random() * normalObstacles.length)];
    }    let topChoice, bottomChoice;
    do {
      topChoice = obstacleSets[selectedSet][Math.floor(Math.random() * obstacleSets[selectedSet].length)];
    } while (topChoice.type === lastTop);

    do {
      bottomChoice = obstacleSets[selectedSet][Math.floor(Math.random() * obstacleSets[selectedSet].length)];
    } while (bottomChoice.type === topChoice.type || bottomChoice.type === lastBottom);

    lastTop = topChoice.type;
    lastBottom = bottomChoice.type;

    let tImg = new Image(); tImg.src = topChoice.src;
    let bImg = new Image(); bImg.src = bottomChoice.src;

    pipes.push({
      x: canvas.width,
      top: { img: tImg, scale: topChoice.scale, type: topChoice.type },
      bottom: { img: bImg, scale: bottomChoice.scale, type: bottomChoice.type },
      passed: false
    });
  }

 // Collisions améliorées
  pipes.forEach(pipe => {
    // On définit une hitbox plus petite que l'image (ex: 70% de la taille)
    const padding = 0.86; 
    const wt = (pipe.top.img.width * pipe.top.scale) * padding;
    const ht = (pipe.top.img.height * pipe.top.scale) * padding;
    const wb = (pipe.bottom.img.width * pipe.bottom.scale) * padding;
    const hb = (pipe.bottom.img.height * pipe.bottom.scale) * padding;

    // Ajustement pour centrer la hitbox réduite sur l'image
    const offsetT = ((pipe.top.img.width * pipe.top.scale) - wt) / 2;
    const offsetB = ((pipe.bottom.img.width * pipe.bottom.scale) - wb) / 2;

    // Collision tuyau du haut
    if (birdX + 25 > pipe.x + offsetT && birdX + 5 < pipe.x + offsetT + wt && birdY + 5 < ht) {
      playDeathSound();
      endGame();
    }
    // Collision tuyau du bas
    if (birdX + 25 > pipe.x + offsetB && birdX + 5 < pipe.x + offsetB + wb && birdY + 25 > canvas.height - hb) {
      playDeathSound();
      endGame();
    }
    
    // Sortie d'écran (Haut/Bas)
    if (birdY > canvas.height || birdY < -20) {
      playDeathSound();
      endGame();
    }
  });
}

function handleScoringLogic() {
  pipes.forEach(pipe => {
    if (!pipe.passed && pipe.x + CONFIG.pipeWidth < birdX) {
      score++;
      pipe.passed = true;
      document.getElementById("scoreDisplayTop").innerText = "Score: " + score;

      // Unlocks Pedri (Bird 1)
      if (selectedBird === "bird1.png" && score % 8 === 0 && score !== lastPedriUnlock) {
        unlockSticker("Pedri", pedriStickerImgs);
        lastPedriUnlock = score;
      }
      // Unlocks Tooth (Bird 2)
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
}

function drawBackground() {
  ctx.drawImage(bgImg, Math.round(bgX), 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, Math.round(bgX + canvas.width), 0, canvas.width, canvas.height);
}

function drawBird() {
  ctx.save();
  
  // Center and rotate
  ctx.translate(birdX + 15, birdY + 15);
  let rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, birdVelocity * 0.1));
  ctx.rotate(rotation);

  // --- FIXED LOGIQUE DU GLOW D'ALERTE ---
  let isNearObstacle = false;
  const alertScale = 0.95; // The detection range

  pipes.forEach(p => {
    // 1. Get the actual rendered dimensions of the top and bottom obstacles
    const wt = p.top.img.width * p.top.scale;
    const ht = p.top.img.height * p.top.scale;
    const hb = p.bottom.img.height * p.bottom.scale;

    // 2. Create the horizontal detection zone (scaled to 0.95)
    const pW = wt * alertScale;
    const pX = p.x + (wt - pW) / 2;
    
    // 3. Check if bird is within the X range AND near the top or bottom Y boundaries
    // We use a small buffer (+20px) to trigger the glow before the collision
    if (birdX < pX + pW && birdX + 30 > pX) {
      if (birdY < ht + 20 || birdY + 30 > canvas.height - hb - 20) {
        isNearObstacle = true;
      }
    }
  });

  if (isNearObstacle) {
    // Apply Glow
    ctx.shadowBlur = 30;
    ctx.shadowColor = "red";
    // Apply Red Filter
    ctx.filter = "sepia(1) saturate(5) hue-rotate(-50deg)";
  }

  // Draw bird (centered)
  ctx.drawImage(birdImg, -15, -15, 30, 30);
  
  ctx.restore(); 
}

function drawPipes() {
  pipes.forEach(pipe => {
    
    ctx.save(); // Save current state (so the aura doesn't bleed onto the bird)
    // --- Add the Red Aura ---
    ctx.shadowBlur = 60;          // How wide the glow is
    ctx.shadowColor = "red";      // The color of the aura
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

 
    let pulse = 10 + Math.sin(frameCount * 0.1) * 5; 
    ctx.shadowBlur = pulse; 
    ctx.shadowColor = "rgba(255, 0, 0, 0.8)";


    // Dessin Haut
    const wt = pipe.top.img.width * pipe.top.scale;
    const ht = pipe.top.img.height * pipe.top.scale;
// Dessin Bas
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
  if (deathSound) {
    // 1. STOP the flap sound immediately
    flapSound.pause();
    flapSound.currentTime = 0; 

    // 2. Play the death sound from the start
    deathSound.currentTime = 0; 
    deathSound.play().catch(e => console.log("Death sound blocked"));
  }
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

// --- LOGIQUE INVENTAIRE ---
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
    const b = document.createElement("button"); b.innerText = "Précédent"; b.className = "pageBtn";
    b.onclick = () => { currentPage--; renderInventoryPage(); };
    controls.appendChild(b);
  }
  if ((currentPage + 1) < totalPages) {
    const b = document.createElement("button"); b.innerText = "Suivant"; b.className = "pageBtn";
    b.onclick = () => { currentPage++; renderInventoryPage(); };
    controls.appendChild(b);
  }
}

function showStickerModal(src) {
  const m = document.createElement("div"); m.className = "stickerModal";
  m.innerHTML = `<img src="${src}" class="bigSticker">`;
  m.onclick = () => m.remove();
  document.body.appendChild(m);

}
