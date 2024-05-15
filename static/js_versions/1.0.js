let canvas;
let context;

let fpsInterval = 1000 / 30;
let then = Date.now();
let request_id;

let player = {
    x: 50,
    y: 150,
    size: 20,
    speed: 10
};
let moveLeft = false;
let moveUp = false;
let moveRight = false;
let moveDown = false;

let enemies = [];

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");

    window.addEventListener("keydown", activate, false);
    window.addEventListener("keyup", deactivate, false);

    spawnEnemies(5); // Spawn initial enemies

    draw();
}

function draw() {
    request_id = window.requestAnimationFrame(draw);
    let now = Date.now();
    let elapsed = now - then;
    if (elapsed < fpsInterval) {
        return;
    }
    then = now - (elapsed % fpsInterval);

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    context.fillStyle = "green";
    context.fillRect(player.x, player.y, player.size, player.size);

    // Move and draw each enemy
    enemies.forEach(enemy => {
        if (enemy.type === 'patroller') {
            // Move the patroller back and forth
            if (enemy.moveDistance >= enemy.patrolLength || enemy.moveDistance <= -enemy.patrolLength) {
                enemy.direction *= -1; // Change direction
            }
            enemy.x += enemy.speed * enemy.direction;
            enemy.moveDistance += enemy.speed * enemy.direction;
        }

        let visionRadius = 200; // Define the vision radius
        let withinVision = distanceBetweenPlayerAndEnemy(player, enemy) <= visionRadius;

        if (withinVision && !enemy.seePlayer) {
            enemy.seePlayer = true;
            enemy.seePlayerTime = now;
        }

        // Check if the enemy has seen the player in the last 10 seconds
        if (enemy.seePlayer && now - enemy.seePlayerTime <= 10000) {
            moveEnemyTowardsPlayer(enemy);

            // Calculate how much time left to follow the player
            let timeLeft = ((10000 - (now - enemy.seePlayerTime)) / 1000).toFixed(1); // Convert to seconds and round to 1 decimal place

            // Display the countdown above the enemy
            context.fillStyle = "white"; // Text color
            context.font = "14px Arial";
            context.fillText(timeLeft + 's', enemy.x, enemy.y - 5); // Position the text above the enemy
        } else if (now - enemy.seePlayerTime > 10000) {
            enemy.seePlayer = false; // Stop following after 10 seconds
        }

        context.fillStyle = "red";
        context.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
    });

    // Update player position based on input
    updatePlayerPosition();

    // Check game conditions
    checkGameConditions();
}

function distanceBetweenPlayerAndEnemy(player, enemy) {
    let dx = player.x - enemy.x;
    let dy = player.y - enemy.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function spawnEnemies(number) {
    let types = ['patroller', 'guardian', 'chaser'];
    for (let i = 0; i < number; i++) {
        let enemy;
        let overlapping;
        do {
            overlapping = false;
            enemy = {
                x: Math.random() * (canvas.width - 20),
                y: Math.random() * (canvas.height - 20),
                size: 20,
                speed: 5,
                type: types[Math.floor(Math.random() * types.length)], // Assign type
                direction: Math.random() < 0.5 ? -1 : 1, // Random direction for patrollers
                moveDistance: 0, // Used for patrollers
                patrolLength: Math.random() * 50 + 50, // Patrol length for patrollers
                seePlayer: false,
                seePlayerTime: null
            };

            // Check if the new enemy overlaps with the player
            if (player_collides(enemy)) {
                overlapping = true;
            }

            // Check if the new enemy overlaps with any existing enemy
            for (let j = 0; j < enemies.length; j++) {
                if (objectsCollide(enemy, enemies[j])) {
                    overlapping = true;
                    break; // No need to check further if overlap is found
                }
            }
        } while (overlapping);

        enemies.push(enemy);
    }
}

function player_collides(enemy) {
    return enemy.x < player.x + player.size &&
           enemy.x + enemy.size > player.x &&
           enemy.y < player.y + player.size &&
           enemy.y + enemy.size > player.y;
}

function objectsCollide(obj1, obj2) {
    return obj1.x < obj2.x + obj2.size &&
           obj1.x + obj1.size > obj2.x &&
           obj1.y < obj2.y + obj2.size &&
           obj1.y + obj1.size > obj2.y;
}



function moveEnemyTowardsPlayer(enemy) {
    if (player.x < enemy.x && enemy.x - enemy.speed > 0) {
        enemy.x -= enemy.speed;
    } else if (player.x > enemy.x && enemy.x + enemy.size + enemy.speed < canvas.width) {
        enemy.x += enemy.speed;
    }

    if (player.y < enemy.y && enemy.y - enemy.speed > 0) {
        enemy.y -= enemy.speed;
    } else if (player.y > enemy.y && enemy.y + enemy.size + enemy.speed < canvas.height) {
        enemy.y += enemy.speed;
    }
}


function updateEnemyPositions() {
    for (let i = 0; i < enemies.length; i++) {
        for (let j = i + 1; j < enemies.length; j++) {
            let enemy1 = enemies[i];
            let enemy2 = enemies[j];

            if (enemiesCollide(enemy1, enemy2)) {
                // Adjust enemy positions to avoid collision
                separateEnemies(enemy1, enemy2);
            }
        }
    }
}

function enemiesCollide(enemy1, enemy2) {
    let dx = enemy1.x - enemy2.x;
    let dy = enemy1.y - enemy2.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    // Check if distance between enemies is less than the sum of their sizes
    return distance < enemy1.size + enemy2.size;
}

function separateEnemies(enemy1, enemy2) {
    let overlap = (enemy1.size + enemy2.size) - distanceBetween(enemy1, enemy2);

    // Calculate direction vector
    let dx = enemy1.x - enemy2.x;
    let dy = enemy1.y - enemy2.y;
    let length = Math.sqrt(dx * dx + dy * dy);
    dx /= length; // Normalize
    dy /= length;

    // Move enemies away from each other based on their overlap
    enemy1.x += dx * overlap / 2;
    enemy1.y += dy * overlap / 2;
    enemy2.x -= dx * overlap / 2;
    enemy2.y -= dy * overlap / 2;
}

function distanceBetween(enemy1, enemy2) {
    let dx = enemy1.x - enemy2.x;
    let dy = enemy1.y - enemy2.y;
    return Math.sqrt(dx * dx + dy * dy);
}


function updatePlayerPosition() {
    if (moveRight && player.x + player.size < canvas.width) {
        player.x += player.speed;
    } else if (moveLeft && player.x > 0) {
        player.x -= player.speed;
    }

    if (moveUp && player.y > 0) {
        player.y -= player.speed;
    } else if (moveDown && player.y + player.size < canvas.height) {
        player.y += player.speed;
    }
}

function checkGameConditions() {
    enemies.forEach(enemy => {
        if (player_collides(enemy)) {
            stop("YOU LOSE!");
        }
    });
}

// I know that using case is not so usual, but after Programming competition I understood how it is powerful.

function activate(event) {
    switch (event.key) {
        case "a":
            moveLeft = true;
            break;
        case "w":
            moveUp = true;
            break;
        case "d":
            moveRight = true;
            break;
        case "s":
            moveDown = true;
            break;
    }
}

function deactivate(event) {
    switch (event.key) {
        case "a":
            moveLeft = false;
            break;
        case "w":
            moveUp = false;
            break;
        case "d":
            moveRight = false;
            break;
        case "s":
            moveDown = false;
            break;
    }
}


function stop(outcome) {
    window.cancelAnimationFrame(request_id);
    window.removeEventListener("keydown", activate);
    window.removeEventListener("keyup", deactivate);
    document.querySelector("#outcome").textContent = outcome;
}
