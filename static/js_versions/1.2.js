// ✞ In Comments I Trust ✞
// and
// ‧₊˚✧Derekism✧˚₊‧
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

    spawnEnemies(7); // Spawn n-mount enemies

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
            let nextX = enemy.x + enemy.speed * enemy.direction;
            if (enemy.moveDistance >= enemy.patrolLength || 
                enemy.moveDistance <= -enemy.patrolLength ||
                nextX > canvas.width - enemy.size || nextX <= 0) {
                enemy.direction *= -1 ; // Change direction
            }
            enemy.x += enemy.speed * enemy.direction;
            enemy.moveDistance += enemy.speed * enemy.direction;
        }
        
        

        let visionRadius = 200; // Define the vision radius
        let withinVision = distanceBetweenPlayerAndEnemy(player, enemy) <= visionRadius; //can be true or false

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
                patrolLength: 1000, // Patrol length for patrollers
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
    // Calculate the direction vector from enemy to player
    let dx = player.x - enemy.x;
    let dy = player.y - enemy.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize the direction vector
    dx = dx / distance;
    dy = dy / distance;

    // Move the enemy towards the player in both x and y directions
    if(distance > 1){ // Prevents jittering when the enemy is too close to the player
        enemy.x += dx * enemy.speed;
        enemy.y += dy * enemy.speed;
    }

    // Prevent enemy from moving outside the canvas
    enemy.x = Math.max(0, Math.min(canvas.width - enemy.size, enemy.x));
    enemy.y = Math.max(0, Math.min(canvas.height - enemy.size, enemy.y));
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

// I know that using case is not so usual, but after Programming competition I understand how it powerful.

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
