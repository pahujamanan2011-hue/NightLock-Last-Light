const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 4000;

const menu = document.getElementById("menu");
const hud = document.getElementById("hud");

const startBtn = document.getElementById("startBtn");
const quitBtn = document.getElementById("quitBtn");

const scoreText = document.getElementById("score");
const ammoText = document.getElementById("ammoText");
const weaponIcon = document.getElementById("weaponIcon");
const livesUI = document.getElementById("livesUI");

const floorTexture = new Image();
floorTexture.src = "assets/images/floor.png";

const playerImg = new Image();
playerImg.src = "assets/images/player.png";

const zombieImg = new Image();
zombieImg.src = "assets/images/zombie.png";

const barrelImg = new Image();
barrelImg.src = "assets/images/barrel.png";

const heartImg = "assets/images/heart.png";

const bossImg = new Image();
bossImg.src = "assets/images/boss.png";

const bgm = new Audio("assets/audio/bgm.mp3");
bgm.loop = true;

const shootSound = new Audio("assets/audio/shoot.mp3");
const goreSound = new Audio("assets/audio/gore.mp3");

let gameRunning = false;
let keys = {};
let mouse = { x: 0, y: 0 };

const camera = {
    x: 0,
    y: 0,
    smoothness: 0.08
};

const player = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    speed: 4,
    size: 64,
    angle: 0,
    ammo: 30,
    weapon: "pistol",
    lives: 3,
    score: 0,
    fireCooldown: 0
};

let zombies = [];
let barrels = [];
let bullets = [];
let boss = null;

window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    if(e.key === "1") {
        player.weapon = "pistol";
        weaponIcon.src = "assets/images/pistol.png";
    }

    if(e.key === "2") {
        player.weapon = "shotgun";
        weaponIcon.src = "assets/images/shotgun.png";
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

canvas.addEventListener("mousedown", shoot);

startBtn.onclick = () => {
    menu.classList.add("hidden");
    hud.classList.remove("hidden");

    bgm.play();

    initBarrels();
    updateLives();

    gameRunning = true;
    requestAnimationFrame(gameLoop);
};

quitBtn.onclick = () => {
    location.reload();
};

function updateLives() {
    livesUI.innerHTML = "";

    for(let i = 0; i < player.lives; i++) {
        const img = document.createElement("img");
        img.src = heartImg;
        img.className = "heart";
        livesUI.appendChild(img);
    }
}

function initBarrels() {
    barrels = [];

    const clusterCount = 8;

    for(let i = 0; i < clusterCount; i++) {

        const clusterX = Math.random() * WORLD_WIDTH;
        const clusterY = Math.random() * WORLD_HEIGHT;

        const count = Math.floor(Math.random() * 2) + 2;

        for(let j = 0; j < count; j++) {
            barrels.push({
                x: clusterX + Math.random() * 120 - 60,
                y: clusterY + Math.random() * 120 - 60,
                size: 60
            });
        }
    }
}

function spawnZombie() {

    if(zombies.length >= 18) return;

    let valid = false;
    let x, y;

    while(!valid) {

        x = player.x + (Math.random() * 2000 - 1000);
        y = player.y + (Math.random() * 2000 - 1000);

        const dx = x - player.x;
        const dy = y - player.y;

        const dist = Math.hypot(dx, dy);

        const angle = Math.atan2(dy, dx);
        const diff = Math.abs(angle - player.angle);

        const visible = diff < 0.5 && dist < 700;

        if(!visible && dist > 700) {
            valid = true;
        }
    }

    zombies.push({
        x,
        y,
        size: 64,
        speed: 1,
        hp: 2,
        aggressive: false
    });
}

setInterval(spawnZombie, 2500);

function shoot() {

    if(player.fireCooldown > 0) return;
    if(player.ammo <= 0) return;

    player.ammo--;
    ammoText.innerText = player.ammo;

    shootSound.currentTime = 0;
    shootSound.play();

    const angle = player.angle;

    const spread = player.weapon === "shotgun" ? 5 : 1;

    for(let i = 0; i < spread; i++) {

        bullets.push({
            x: player.x,
            y: player.y,
            angle: angle + ((Math.random() - 0.5) * 0.3),
            speed: 12,
            life: 60
        });
    }

    player.fireCooldown = player.weapon === "shotgun" ? 40 : 12;
}

function updatePlayer() {

    let moveX = 0;
    let moveY = 0;

    if(keys["w"] || keys["arrowup"]) moveY -= player.speed;
    if(keys["s"] || keys["arrowdown"]) moveY += player.speed;
    if(keys["a"] || keys["arrowleft"]) moveX -= player.speed;
    if(keys["d"] || keys["arrowright"]) moveX += player.speed;

    player.x += moveX;
    player.y += moveY;

    player.x = Math.max(0, Math.min(WORLD_WIDTH, player.x));
    player.y = Math.max(0, Math.min(WORLD_HEIGHT, player.y));

    player.angle = Math.atan2(
        mouse.y - canvas.height / 2,
        mouse.x - canvas.width / 2
    );

    if(player.fireCooldown > 0) {
        player.fireCooldown--;
    }
}

function updateCamera() {

    camera.x += ((player.x - canvas.width / 2) - camera.x) * camera.smoothness;

    camera.y += ((player.y - canvas.height / 2) - camera.y) * camera.smoothness;

    camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH - canvas.width));

    camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT - canvas.height));
}

function updateBullets() {

    bullets.forEach(b => {
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;
        b.life--;
    });

    bullets = bullets.filter(b => b.life > 0);
}

function updateZombies() {

    zombies.forEach(z => {

        const dx = player.x - z.x;
        const dy = player.y - z.y;

        const dist = Math.hypot(dx, dy);

        const angleToZombie = Math.atan2(dy, dx);

        const flashlight = Math.abs(angleToZombie - player.angle) < 0.5;

        if(flashlight && dist < 500) {
            z.speed = 2.7;
            z.aggressive = true;
        }
        else {
            z.speed = 0.8;
            z.aggressive = false;
        }

        z.x += (dx / dist) * z.speed;
        z.y += (dy / dist) * z.speed;

        if(dist < 40) {
            player.lives--;
            updateLives();

            z.x += Math.random() * 300 - 150;
            z.y += Math.random() * 300 - 150;

            if(player.lives <= 0) {
                alert("GAME OVER");
                location.reload();
            }
        }
    });
}

function bulletCollision() {

    bullets.forEach(b => {

        zombies.forEach(z => {

            const dx = b.x - z.x;
            const dy = b.y - z.y;

            const dist = Math.hypot(dx, dy);

            if(dist < 40) {

                z.hp--;
                b.life = 0;

                if(z.hp <= 0) {

                    goreSound.currentTime = 0;
                    goreSound.play();

                    player.score += 10;
                    scoreText.innerText = player.score;

                    if(Math.random() < 0.4) {
                        player.ammo += 5;
                        ammoText.innerText = player.ammo;
                    }
                }
            }
        });
    });

    zombies = zombies.filter(z => z.hp > 0);
}

function drawFloor() {

    const tile = 256;

    for(let x = 0; x < WORLD_WIDTH; x += tile) {
        for(let y = 0; y < WORLD_HEIGHT; y += tile) {

            ctx.drawImage(
                floorTexture,
                x - camera.x,
                y - camera.y,
                tile,
                tile
            );
        }
    }
}

function drawBarrels() {

    barrels.forEach(b => {

        ctx.drawImage(
            barrelImg,
            b.x - camera.x,
            b.y - camera.y,
            b.size,
            b.size
        );
    });
}

function drawPlayer() {

    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(player.angle + Math.PI / 2);

    ctx.drawImage(
        playerImg,
        -32,
        -32,
        64,
        64
    );

    ctx.restore();
}

function drawZombies() {

    zombies.forEach(z => {

        ctx.drawImage(
            zombieImg,
            z.x - camera.x,
            z.y - camera.y,
            z.size,
            z.size
        );
    });
}

function drawBullets() {

    ctx.fillStyle = "yellow";

    bullets.forEach(b => {

        ctx.beginPath();
        ctx.arc(
            b.x - camera.x,
            b.y - camera.y,
            3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}

function drawLighting() {

    ctx.fillStyle = "rgba(0,0,0,0.96)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.globalCompositeOperation = "destination-out";

    const length = 500;
    const spread = 0.5;

    const leftX = canvas.width / 2 + Math.cos(player.angle - spread) * length;
    const leftY = canvas.height / 2 + Math.sin(player.angle - spread) * length;

    const rightX = canvas.width / 2 + Math.cos(player.angle + spread) * length;
    const rightY = canvas.height / 2 + Math.sin(player.angle + spread) * length;

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
}

function render() {

    ctx.clearRect(0,0,canvas.width,canvas.height);

    drawFloor();
    drawBarrels();
    drawBullets();
    drawZombies();
    drawPlayer();
    drawLighting();
}

function gameLoop() {

    if(!gameRunning) return;

    updatePlayer();
    updateCamera();
    updateBullets();
    updateZombies();
    bulletCollision();

    render();

    requestAnimationFrame(gameLoop);
}