// ✞ In Comments I Trust ✞
let canvas;
let context;

let fpsInterval = 1000 / 30;
let then = Date.now();
let request_id;

let playerImage = new Image();

let player = {
    x: 500,
    y: 500,
    frameX: 0,
    frameY: 0,
    height: 64,
    width: 44,
    speed: 10
};
let moveLeft = false;
let moveUp = false;
let moveRight = false;
let moveDown = false;

let enemies = [];

let walls = [
    { x: 100, y: 100, width: 20, height: 200 },
    { x: 500, y: 100, width: 200, height: 200 }
];


document.addEventListener("DOMContentLoaded", init, false);

function init() {
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");

    window.addEventListener("keydown", activate, false);
    window.addEventListener("keyup", deactivate, false);

    load_assets([
        { "var": playerImage, "url": "static/sprites/chaser/Run.png" },
    ], draw)

    spawnEnemies(1); // Spawn n-mount enemies

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
    context.fillStyle = 'black'; // Wall color
    walls.forEach(wall => {
        context.fillRect(wall.x, wall.y, wall.width, wall.height);
    });

    // Draw player
    context.drawImage(playerImage,
        player.frameX * player.width, player.frameY * player.height, player.width, player.height,
        player.x, player.y, player.width, player.height);


    // Animation of player
    if (moveRight && !moveLeft) {
        player.frameX = (player.frameX + 1) % 7;
        player.frameY = 0;
    } else if (moveLeft && !moveRight) {
        player.frameX = (player.frameX + 1) % 7;
        player.frameY = 1;
    } else if ((moveDown || moveUp) &&
        !(moveDown && moveUp)) {
        if (player.frameY == 1 || (player.frameY == 2 && player.frameX == 1)) { // facing left
            player.frameY = 1;
            player.frameX = (player.frameX + 1) % 7;
        } else if (player.frameY == 0  || (player.frameY == 2 && player.frameX == 0)) { // facing right
            player.frameY = 0;
            player.frameX = (player.frameX + 1) % 7;
        }
    } else if (!moveDown && !moveUp && !moveLeft && !moveRight) {
        // When the player is not moving, set to a standing frame based on the last direction faced
        if (player.frameY == 0) { // facing right
            player.frameY = 2;
            player.frameX = 0;
        } else if (player.frameY == 1) { // facing left
            player.frameY = 2;
            player.frameX = 1;
        }
    }


    // Move and draw each enemy
    enemies.forEach(enemy => {

        if (enemy.type === 'patroller') {
            let nextX = enemy.x + enemy.speed * enemy.direction;
            if ((enemy.moveDistance >= enemy.patrolLength || enemy.moveDistance <= -enemy.patrolLength ||
                nextX > canvas.width - enemy.width ||
                nextX <= 0 ||
                collidesWithWall(enemy)
            )) {
                enemy.direction *= -1; // Change direction
            }
            enemy.x += enemy.speed * enemy.direction;
            enemy.moveDistance += enemy.speed * enemy.direction;
        }
        if (enemy.seePlayer && now - enemy.seePlayerTime <= 10000) {
            moveEnemyTowardsPlayer(enemy); // Move enemy towards the player
        }

        let visionRadius = 200; // Define the vision radius
        let withinVision = distanceBetweenPlayerAndEnemy(player, enemy) <= visionRadius; //can be true or false
        let lineOfSight = lineOfSightClear(enemy.x, enemy.y, player.x, player.y); // Check line of sight

        if (withinVision && lineOfSight && !enemy.seePlayer) {
            enemy.seePlayer = true;
            enemy.seePlayerTime = now;
        }

        if (enemy.seePlayer) {
            // Check if the enemy has seen the player in the last 10 seconds
            if (now - enemy.seePlayerTime <= 10000) {
                // Continue following the player
                // Calculate how much time left to follow the player
                let timeLeft = ((10000 - (now - enemy.seePlayerTime)) / 1000).toFixed(1); // Convert to seconds and round to 1 decimal place

                // Display the countdown above the enemy
                context.fillStyle = "white"; // Text color
                context.font = "14px Arial";
                context.fillText(timeLeft + 's', enemy.x, enemy.y - 5); // Position the text above the enemy
            } else {
                enemy.seePlayer = false; // Stop following after 10 seconds
            }
        }

        context.fillStyle = "red";
        context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
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
    let types = ['patroller', 'chaser'];
    let visionRadius = 200;
    for (let i = 0; i < number; i++) {
        let enemy;
        let overlapping;
        do {
            overlapping = false;
            enemy = {
                x: Math.random() * (canvas.width - 20),
                y: Math.random() * (canvas.height - 20),
                width: 44,
                height: 64,
                speed: 5,
                type: types[Math.floor(Math.random() * types.length)], // Assign type
                direction: Math.random() < 0.5 ? -1 : 1, // Random direction for patrollers
                moveDistance: 0, // Used for patrollers
                patrolLength: 200, // Patrol length for patrollers
                seePlayer: false,
                seePlayerTime: null
            };

            if (distanceBetweenPlayerAndEnemy(player, enemy) < visionRadius) {
                overlapping = true;
            }

            // Check if the new enemy overlaps with the player
            if (player_collides(enemy)) {
                overlapping = true;
            }

            // Check if the new enemy overlaps with any existing enemy
            enemies.forEach((existingEnemy) => {
                if (objectsCollide(enemy, existingEnemy)) {
                    overlapping = true;
                }
            });

            walls.forEach((wall) => {
                if (collidesWithWall(enemy, wall)) { // Assume collidesWithWall is adapted to accept a wall argument
                    overlapping = true;
                }
            });

        } while (overlapping);

        enemies.push(enemy);
    }
}

function player_collides(enemy) {
    return enemy.x < player.x + player.width &&
        enemy.x + enemy.width > player.x &&
        enemy.y < player.y + player.height &&
        enemy.y + enemy.height > player.y;
}

function playerAround(enemy) {
    return enemy.x < player.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y;
}

function objectsCollide(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y;
}

function collidesWithWall(obj) {
    return walls.some(wall => {
        return obj.x < wall.x + wall.width &&
            obj.x + obj.width > wall.x &&
            obj.y < wall.y + wall.height &&
            obj.y + obj.height > wall.y;
    });
}




function moveEnemyTowardsPlayer(enemy) {
    // Calculate the direction vector from enemy to player
    let dx = player.x - enemy.x;
    let dy = player.y - enemy.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize the direction vector
    if (distance > 0) { // Check to avoid division by zero
        dx = dx / distance;
        dy = dy / distance;
    }

    // Calculate potential new positions
    let potentialX = enemy.x + (dx * enemy.speed);
    let potentialY = enemy.y + (dy * enemy.speed);

    // Check for collisions with walls at the potential new position
    // Temporarily set enemy's new potential position to check for wall collision
    let originalPosition = { x: enemy.x, y: enemy.y }; // Remember original position
    enemy.x = potentialX;
    enemy.y = potentialY;

    // If the new position collides with a wall, prevent movement
    if (collidesWithWall(enemy)) {
        enemy.x = originalPosition.x; // Revert to original position if collision
        enemy.y = originalPosition.y;
    } else {
        // If no collision, update to potential position
        enemy.x = Math.max(0, Math.min(canvas.width - enemy.width, potentialX));
        enemy.y = Math.max(0, Math.min(canvas.height - enemy.height, potentialY));
    }

    // FUTURE PLAN: reactions to hitting a wall, such as stopping, turning around....
    // CONSTRUCTION IN PROCESS...
}



function updatePlayerPosition() {
    // Calculate potential new position based on current movement direction
    let potentialX = player.x;
    let potentialY = player.y;

    if (moveRight) {
        potentialX += player.speed;
    } else if (moveLeft) {
        potentialX -= player.speed;
    }

    if (moveUp) {
        potentialY -= player.speed;
    } else if (moveDown) {
        potentialY += player.speed;
    }

    // Check for wall collisions at the potential new position
    let collides = collidesWithWall({
        x: potentialX,
        y: potentialY,
        width: player.width,
        height: player.height
    });

    // Update position only if there is no collision with walls
    if (!collides) {
        player.x = potentialX;
        player.y = potentialY;
    }

    // Ensure the player does not go out of the canvas boundaries
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}




function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    // Calculate parts of the equations to check for intersection
    let denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denominator == 0) return false; // Lines are parallel

    let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    let u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

    return (t >= 0 && t <= 1 && u >= 0 && u <= 1);
}


function lineOfSightClear(x1, y1, x2, y2) {
    for (let wall of walls) {
        // Check each edge of the wall
        // Top edge
        if (lineIntersectsLine(x1, y1, x2, y2, wall.x, wall.y, wall.x + wall.width, wall.y)) return false;
        // Bottom edge
        if (lineIntersectsLine(x1, y1, x2, y2, wall.x, wall.y + wall.height, wall.x + wall.width, wall.y + wall.height)) return false;
        // Left edge
        if (lineIntersectsLine(x1, y1, x2, y2, wall.x, wall.y, wall.x, wall.y + wall.height)) return false;
        // Right edge
        if (lineIntersectsLine(x1, y1, x2, y2, wall.x + wall.width, wall.y, wall.x + wall.width, wall.y + wall.height)) return false;
    }
    return true; // No intersection with any walls
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

function load_assets(assets, callback) {
    let num_assets = assets.length;
    let loaded = function () {
        console.log("loaded");
        num_assets = num_assets - 1;
        if (num_assets === 0) {
            callback();
        }
    };
    for (let asset of assets) {
        let element = asset.var;
        if (element instanceof HTMLImageElement) {
            console.log("img");
            element.addEventListener("load", loaded, false);
        }
        else if (element instanceof HTMLAudioElement) {
            console.log("audio");
            element.addEventListener("canplaythrough", loaded, false);
        }
        element.src = asset.url;
    }
}
