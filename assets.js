const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const deathSound = new Audio("death.mp3");
const flapSound = new Audio("miaw.mp3"); 
// Adjust Volumes
flapSound.volume = 0.4;
deathSound.volume = 1.0;  

const birdImg = new Image();
birdImg.src = "playerHead.png";

const bgImg = new Image();
bgImg.src = "background.png";


let selectedSet = "classic"; // Set par défaut
const obstacleSets = {
  classic: [
    { src: "dagger.png", scale: 0.157, type: "short", w: 50, h: 160 },
    { src: "sword.png", scale: 0.121, type: "long", w: 40, h: 290 },
    { src: "axe.png", scale: 0.35, type: "medium", w: 60, h: 200 },
  ],
  strangerthings: [ 
    { src: "demagorgone.png", scale: 0.38, type: "monster", w: 70, h: 180 },
    { src: "demadog.png", scale: 0.40, type: "time", w: 50, h: 200 },
    { src: "henry creel creepy.png", scale: 0.42, type: "light", w: 40, h: 150 },
    { src: "vecna.png", scale: 0.26, type: "rare", w: 60, h: 220 }
  ]
};

const pedriStickerImgs = [
  "pedri1.png",
  "pedri2.png",
  "pedri3.png",
  "pedri4.png",
  "pedri5.png",
  "pedri6.png",
  "pedri7.png",
  "pedri8.png",
  "pedri9.png",
  "pedri10.png",
  "pedri11.png",
  "pedri12.png",
  "pedri13.png",
  "pedri14.png",
  "pedri15.png",
  "pedri16.png",
  "pedri17.png",
  "pedri18.png",
  "pedri19.png",
];

const toothStickerImgs = [
  "teeth1.png",
  "teeth2.png",
  "teeth3.png",
  "teeth4.png",
  "teeth5.png",
  "teeth6.png",
  "teeth7.png",
  "teeth8.png",
  "teeth9.png",
  "teeth10.png",
  "teeth11.png",
  "teeth12.png",
  "teeth13.png",
  "teeth14.png",
  "teeth15.png",
  "teeth16.png",
  "teeth17.png",
  "teeth18.png",
  "teeth19.png",
  "teeth20.png"  
];

// Preload all images
[...pedriStickerImgs, ...toothStickerImgs].forEach(src => {
  const img = new Image();
  img.src = src;
});


