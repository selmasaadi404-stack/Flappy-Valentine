
function showScreen(id) {
  const screens = ["birdSelectScreen", "startScreen", "gameOverScreen", "gameCanvas", "inventoryScreen"];
  
  screens.forEach(screenId => {
    const el = document.getElementById(screenId);
    if (!el) return;

    // Hide everything first
    el.style.display = "none";
    el.classList.remove("fall-animation", "romantic-animation");
  });

  const target = document.getElementById(id);
  if (target) {
    target.style.display = (id === "gameCanvas") ? "block" : "flex";

    // Add funny/romantic transitions based on the screen
    if (id === "gameOverScreen") {
      target.classList.add("fall-animation"); // It "falls" because you lost!
    } else if (id === "startScreen" || id === "birdSelectScreen") {
      target.classList.add("romantic-animation"); // Soft entry for the lovey parts
    }
  }
}


function pulseButton(btnId) {
  const btn = document.getElementById(btnId);
  btn.classList.add("pulse-once");
  setTimeout(() => btn.classList.remove("pulse-once"), 400);
}

