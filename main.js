document.getElementById("startBtn").addEventListener("click", () => {
  pulseButton("startBtn");
  showScreen("gameCanvas"); // reveal canvas
  startGame();              // start game logic
});

document.getElementById("restartBtn").addEventListener("click", () => {
  pulseButton("restartBtn");
  showScreen("gameCanvas"); // reveal canvas
  restartGame();            // restart game logic
});


let birdPicked = false;
let setPicked = false;

// Sélection de l'oiseau
document.querySelectorAll('.bird-opt').forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Retirer la classe active des autres oiseaux
    document.querySelectorAll('.bird-opt').forEach(img => img.classList.remove('active'));
    // Ajouter à celui cliqué
    e.target.classList.add('active');
    
    selectedBird = e.target.dataset.type;
    birdImg.src = selectedBird;
    birdPicked = true;
    checkIfReady();
  });
});

// Sélection du set d'obstacles
document.querySelectorAll('.set-opt').forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Retirer la classe active des autres sets
    document.querySelectorAll('.set-opt').forEach(img => img.classList.remove('active'));
    // Ajouter à celui cliqué
    e.target.classList.add('active');
    
    selectedSet = e.target.dataset.set;
    setPicked = true;
    checkIfReady();
  });
});

// Vérifier si on peut activer le bouton
function checkIfReady() {
  const confirmBtn = document.getElementById("confirmSelectBtn");
  if (birdPicked && setPicked) {
    confirmBtn.disabled = false;
    confirmBtn.classList.add("ready");
  }
}

document.getElementById("confirmSelectBtn").addEventListener("click", () => {
  if (birdPicked && setPicked) {
    // 1. Fixer la taille
    const containerWidth = Math.min(window.innerWidth, 400);
    const containerHeight = Math.min(window.innerHeight * 0.7, 600);
    
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    // 2. FORCER un premier dessin immédiat pour éviter le noir
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (bgImg.complete) {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    }

    showScreen("startScreen");
  }
});

// Pour éviter le scroll sur mobile
window.addEventListener('keydown', (e) => {
  if(e.code === "Space") e.preventDefault();
});
document.getElementById("inventoryBtn").addEventListener("click", showInventory);
document.getElementById("backBtn").addEventListener("click", () => {
document.getElementById("inventoryScreen").style.display = "none";
document.getElementById("gameOverScreen").style.display = "block";
currentPage = 0; // Reset la page pour la prochaine fois
});

function flap() {
  // Only play flap if the game is actually running
  if (gameRunning) {
    birdVelocity = CONFIG.jumpStrength;

    if (flapSound) {
      flapSound.currentTime = 0;
      flapSound.play().catch(e => {}); 
    }
  }
}

// Support Clavier
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    flap();
  }
});

// Support Tactile (Mobile)
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault(); // EMPÊCHE LE SCROLL ET LE ZOOM
  flap();
}, { passive: false });

// Support Clic Souris (Desktop)
canvas.addEventListener("mousedown", (e) => {
  flap();
});

// Ajoute un feedback visuel à TOUS les boutons au toucher
document.querySelectorAll('button, .select-icon, #startBtn, #restartBtn').forEach(button => {
  button.addEventListener('touchstart', () => {
    button.style.filter = "drop-shadow(0 0 10px #FFD1DC) brightness(1.2)";
  });
  
  button.addEventListener('touchend', () => {
    setTimeout(() => {
      button.style.filter = "none";
    }, 100);
  });
});
