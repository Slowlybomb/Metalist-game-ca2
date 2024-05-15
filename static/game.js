// ✞ In Comments I Trust ✞
// sounds where taken from MGS:2 and free resources
// Images does not need notation, because they are from free resources or made myself
let canvas;
let context;

let xhttp;

let gameTime, request_id, finalTime , sound;
let fpsInterval = 1000 / 30;
let then = Date.now();
let extraMessage = "";
let startTime;
let amount_of_enemies = parseInt(document.getElementById("amount_of_enemies").innerText);

console.log(amount_of_enemies)

let playerImage = new Image();
let chaserImage = new Image();
let patrollerImage = new Image();
let coverImage = new Image();
let policeCarImage = new Image();
let carImage = new Image();
let barrierImage = new Image();
let barrierLongImage = new Image();
let gatesImageOpen = new Image();
let gatesImageClose = new Image();
let enemyImage = null;
let scarfImage = new Image();
let ticketImage = new Image();
let flareImage = new Image();

// sounds var
let foundSound = new Audio();
let takeSound = new Audio();
let openSound = new Audio();
let gameoverSound = new Audio();
let confusedSound = new Audio();
let winSound = new Audio();



let player = {
    x: 500,
    y: 500,
    frameX: 0,
    frameY: 0,
    height: 64,
    width: 44,
    speed: 6,
    descriptor: "✪",
    beenSeen: false,
};

let moveLeft = false;
let moveUp = false;
let moveRight = false;
let moveDown = false;

let enemies = [];

let walls = [
    { x: 100, y: 100, width: 120, height: 60, image: policeCarImage },
    { x: 500, y: 100, width: 60, height: 120, image: carImage },
    { x: 600, y: 360, width: 80, height: 100, image: barrierImage },
    { x: 100, y: 500, width: 180, height: 100, image: barrierLongImage },
    { x: 1020, y: 0, width: 65, height: 760, image: gatesImageClose },
];

let collectibles = [
    { x: 200, y: 300, width: 60, height: 60, name: "Scarf", image: scarfImage },
    { x: 450, y: 620, width: 60, height: 30, name: "Ticket", image: ticketImage },
    { x: 700, y: 100, width: 15, height: 60, name: "Flare", image: flareImage }
];

let covers = [
    { x: 300, y: 400, width: 50, height: 50 },
    { x: 900, y: 600, width: 50, height: 50 },
    { x: 400, y: 100, width: 50, height: 50 },
    { x: 850, y: 100, width: 50, height: 50 },
    { x: 500, y: 600, width: 50, height: 50 },
    { x: 800, y: 300, width: 50, height: 50 }
];

// add to list (inventory)
function addToCollectedItems(item) {
    let collectedItemsElement = document.getElementById('collectedItems');
    let itemElement = document.createElement('li');
    itemElement.textContent = item.name;
    collectedItemsElement.appendChild(itemElement);
}

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");
    window.addEventListener("keydown", activate, false);
    window.addEventListener("keyup", deactivate, false);

    load_assets([
        { "var": playerImage, "url": "static/sprites/player/player.png" },
        { "var": chaserImage, "url": "static/sprites/chaser/Run.png" },
        { "var": patrollerImage, "url": "static/sprites/patroller/patroller.png" },
        { "var": coverImage, "url": "static/sprites/objects/garbage.png" },
        { "var": barrierImage, "url": "static/sprites/objects/barrier.png" },
        { "var": carImage, "url": "static/sprites/objects/car-black.png" },
        { "var": policeCarImage, "url": "static/sprites/objects/police-car.png" },
        { "var": gatesImageOpen, "url": "static/sprites/objects/gates-open.png" },
        { "var": gatesImageClose, "url": "static/sprites/objects/Gates-closed.png" },
        { "var": barrierLongImage, "url": "static/sprites/objects/barrier-long.png" },
        { "var": scarfImage, "url": "static/sprites/objects/scarf.png" },
        { "var": flareImage, "url": "static/sprites/objects/flare.png" },
        { "var": ticketImage, "url": "static/sprites/objects/ticket.png" },
        // Sounds
        { "var": foundSound, "url": "static/music/found.wav" },
        { "var": takeSound, "url": "static/music/itemequip.wav"},
        { "var": openSound, "url": "static/music/doorbuzz.wav"},
        { "var": gameoverSound, "url": "static/music/gameover.wav"},
        { "var": confusedSound, "url": "static/music/confused.mp3"},
        { "var": winSound, "url": "static/music/win.mp3"}], draw)

    spawnEnemies(amount_of_enemies); // Spawn n-mount enemies

}

function draw() {
    request_id = window.requestAnimationFrame(draw);
    let now = Date.now();
    let elapsed = now - then;
    if (elapsed < fpsInterval) {
        return;
    }
    updateDOMTime();

    then = now - (elapsed % fpsInterval);
    context.clearRect(0, 0, canvas.width, canvas.height);

    updateGameTime(startTime)

    
    // Draw wall
    walls.forEach(wall => {
        if (collectibles.length === 0) {
            walls[4].image = gatesImageOpen;
            document.getElementById('messages').textContent = "Go to entrance!";
        }
        context.drawImage(wall.image, 0, 0, wall.width, wall.height,
            wall.x, wall.y, wall.width, wall.height);
    });

    // Draw cover
    covers.forEach(obj => {
        context.drawImage(coverImage,
            0, 0, obj.width, obj.height,
            obj.x, obj.y, obj.width, obj.height);
    });

    // Draw player
    if (!player.isHidden) {

        context.drawImage(playerImage,
            player.frameX * player.width, player.frameY * player.height, player.width, player.height,
            player.x, player.y, player.width, player.height);
        context.font = "20px Arial";
        context.fillStyle = 'gold';
        context.fillText(player.descriptor, player.x + 14, player.y - 8);
    } else {
        context.font = "10px Arial";
        context.fillStyle = 'gold';
        context.fillText("You are hiding", player.x, player.y + 20);
    }


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
        } else if (player.frameY == 0 || (player.frameY == 2 && player.frameX == 0)) { // facing right
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



    // Draw collectibles
    collectibles.forEach(item => {
        context.drawImage(item.image, 0, 0, item.width, item.height,
            item.x, item.y, item.width, item.height);
        context.fillStyle = 'gold';
        context.font = "15px Arial";
        context.fillText(item.name, item.x, item.y - 5);
    });


    // Move and draw each enemy
    enemies.forEach(enemy => {
        let visionRadius = 200; // Define the vision radius
        let withinVision = distanceBetweenPlayerAndEnemy(player, enemy) <= visionRadius;
        let lineOfSight = lineOfSightClear(enemy.x, enemy.y, player.x, player.y);
        let now = Date.now(); // Current timestamp

        // Check if the enemy is confused before checking other states
        if (enemy.confused) {
            drawConfused(enemy);
        } else {
            if (withinVision && lineOfSight && !player.isHidden) {
                playSound(foundSound)
                enemy.seePlayer = true;
                player.beenSeen = true;
                enemy.seePlayerTime = now;
                context.fillStyle = "red";
                context.font = "30px Arial";
                context.fillText("!", enemy.x + 20, enemy.y - 5);
            } else {
                // The enemy can't see the player right now
                if (enemy.seePlayer && now - enemy.seePlayerTime <= 5000) {
                    // Enemy continues moving towards the player's last known position
                    moveEnemyTowardsPlayer(enemy);

                    // Display the countdown above the enemy
                    let timeLeft = ((5000 - (now - enemy.seePlayerTime)) / 1000).toFixed(1); // Convert to seconds and round to 1 decimal place
                    context.fillStyle = "white"; // Text color
                    context.font = "14px Arial";
                    context.fillText(timeLeft + 's', enemy.x, enemy.y - 5);
                } else {
                    // Time is up, reset the enemy's state
                    enemy.seePlayer = false;
                }
            }

            // Continue to check and update position if the enemy can still "see" the player
            if (enemy.seePlayer) {
                moveEnemyTowardsPlayer(enemy);
            } else {
                patrolOrIdle(enemy);
            }
        }

        // Drawing and animation logic for enemy types
        if (enemy.type == "patroller") {
            enemyImage = patrollerImage;
        } else if (enemy.type == "chaser") {
            enemyImage = chaserImage;
        }

        context.drawImage(enemyImage, enemy.frameX * enemy.width, enemy.frameY * enemy.height, enemy.width, enemy.height, enemy.x, enemy.y, enemy.width, enemy.height);


        // Animation of enemy
        if (enemy.seePlayer) {
            if (player.x >= enemy.x) {
                enemy.frameX = (enemy.frameX + 1) % 7;
                enemy.frameY = 0;
            } else if (player.x <= enemy.x) {
                enemy.frameX = (enemy.frameX + 1) % 7;
                enemy.frameY = 1;
            }
        } else if (enemy.type == "patroller" && !enemy.seePlayer) {
            if (enemy.type == "patroller" && enemy.direction == 1) {
                enemy.frameX = (enemy.frameX + 1) % 7;
                enemy.frameY = 0;
            } else if (enemy.type == "patroller" && enemy.direction == -1) {
                enemy.frameX = (enemy.frameX + 1) % 7;
                enemy.frameY = 1;
            }
        } else if (!enemy.seePlayer) {
            enemy.frameX = 0;
            enemy.frameY = 2;
        }

    });

    // Check for and handle item collection
    checkForItemCollection();

    function checkForItemCollection() {
        collectibles.forEach((item, index) => {
            if (player.x < item.x + 30 && player.x + player.width > item.x &&
                player.y < item.y + 30 && player.y + player.height > item.y) {
                addToCollectedItems(item);
                playSound(takeSound)
                collectibles.splice(index, 1); // Remove the item from the array so it can't be collected again
            }
        });
    }

    // Update player position based on input
    updatePlayerPosition();

    // Check game conditions
    checkGameConditions();
    
    if (collectibles.length === 0) {
        playSound(openSound)
    }

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
                x: Math.random() * (canvas.width - 44),
                y: Math.random() * (canvas.height - 64),
                width: 44,
                height: 64,
                speed: 2,
                type: types[Math.floor(Math.random() * types.length)], // Assign type
                direction: Math.random() < 0.5 ? -1 : 1, // Random direction for patrollers
                moveDistance: 0, // Used for patrollers
                patrolLength: Math.random() * (300 - 100) + 100, // Patrol length for patrollers
                frameX: 0,
                frameY: 0,
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

function drawConfused(enemy) {
    context.fillStyle = "red";
    context.font = "14px Arial";
    context.fillText("Confused", enemy.x, enemy.y - 10);
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
    if (!player.isHidden) {
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
    }
}
function updateGameTime() {
    let now = Date.now();
    if (!startTime) {
        console.error('startTime is undefined');
        return 0;
    }
    let elapsedTime = (now - startTime) / 1000;
    return elapsedTime;
}



function updateDOMTime() {
    let gameTimeDisplay = updateGameTime();
    let timeElement = document.getElementById('time');
    if (!timeElement) {
        console.error("Time element not found");
        return;
    }
    // ${} https://www.freecodecamp.org/news/what-does-the-dollar-sign-mean-in-javascript/#:~:text=The%20dollar%20sign%20followed%20by,m%20%24%7Bage%7D%20years%20old.
    timeElement.textContent = `Time: ${gameTimeDisplay} seconds`;
}



function updatePlayerPosition() {
    // If player is hidden, it will just return
    if (player.isHidden) {
        return;
    }
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

function patrolOrIdle(enemy) {
    if (enemy.type === 'patroller') {
        let nextX = enemy.x + enemy.speed * enemy.direction;
        if ((enemy.moveDistance >= enemy.patrolLength || enemy.moveDistance <= -enemy.patrolLength ||
            nextX > canvas.width - enemy.width || nextX <= 0 || collidesWithWall(enemy))) {
            enemy.direction *= -1; // Change direction
        }
        enemy.x += enemy.speed * enemy.direction;
        enemy.moveDistance += enemy.speed * enemy.direction;
    }
}

function handleEnemyAnimation(enemy) {
    if (!enemy.seePlayer) {
        enemy.frameX = 0;
        enemy.frameY = 2;
    } else {
        if (player.x >= enemy.x) {
            enemy.frameX = (enemy.frameX + 1) % 7;
            enemy.frameY = 0;
        } else {
            enemy.frameX = (enemy.frameX + 1) % 7;
            enemy.frameY = 1;
        }
    }
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

function playSound(sound) {
    if (sound.paused) {
        sound.play().catch(error => {
            console.error("Error playing sound:", error);
        });
    }
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

        case " ":
            hidePlayer();
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
        case " ":
            if (player.isHidden) {
                unhidePlayer();
            }
            break;
    }
}


function hidePlayer() {
    if (player.isHidden) return;  // Prevent hiding again if already hidden

    let canHide = covers.some(obj =>
        player.x < obj.x + obj.width + 30 && player.x + player.width > obj.x - 30 &&
        player.y < obj.y + obj.height + 30 && player.y + player.height > obj.y - 30
    );

    if (canHide) {
        player.isHidden = true;
        document.getElementById('messages').textContent = "You are hiding";
        player.hideTimeout = setTimeout(unhidePlayer, 5000); // Set timeout for auto-unhide

        // Make enemies confused
        enemies.forEach(enemy => {
            if (enemy.seePlayer) {
                playSound(confusedSound);
                enemy.confused = true;
                enemy.seePlayer = false; // They no longer see the player
                setTimeout(() => enemy.confused = false, 5000); // Confusion lasts for 5 seconds
            }
        });
    } else {
        document.getElementById('messages ').textContent = "No hiding spot nearby!";
        setTimeout(() => {
            if (!player.isHidden) document.getElementById('hidden').textContent = "";
        }, 2000);
    }
}

function unhidePlayer() {
    if (!player.isHidden) return;  // Only unhide if currently hidden

    clearTimeout(player.hideTimeout);  // Clear the hide timeout
    player.isHidden = false;
    document.getElementById('messages').textContent = "";
    // Reset any visual changes made when hiding
}

function load_assets(assets, callback) {
    let num_assets = assets.length;
    let loaded = function () {
        console.log("loaded");
        num_assets = num_assets - 1;
        if (num_assets === 0) {
            startTime = Date.now();
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



function checkGameConditions() {
    enemies.forEach(enemy => {
        if (player_collides(enemy)) {
            sound = gameoverSound
            stop("YOU LOSE!", sound);
        }
    });
    if (collectibles.length === 0 &&
        player.x + player.width >= canvas.width - 100 &&
        player.y >= 350 &&
        player.y <= 350 + 52) { 
        sound = winSound
        let finalTime = updateGameTime();
        let points = Math.round(100000/finalTime);
        finalTime = finalTime.toFixed(2)
        console.log(finalTime)
        let message = "YOU WON! TIME: " + finalTime +"s";
        if (!player.beenSeen) {
            points += 3000;
            extraMessage = " + EXTRA POINTS FOR NOT BEEN SEEN";
        }
        message += " POINTS: " + points + extraMessage;
        stop(message, points, finalTime, );
    }
}



function stop(outcome, points, finalTime) {
    window.cancelAnimationFrame(request_id);
    window.removeEventListener("keydown", activate);
    window.removeEventListener("keyup", deactivate);
    document.querySelector("#outcome").textContent = outcome;
    playSound(sound)

    let data = new FormData();
    data.append("points", points);
    data.append("time", finalTime);
    console.log(finalTime)
    data.append("beenSeen", player.beenSeen);
    data.append("amount_of_enemies", amount_of_enemies);

    xhttp = new XMLHttpRequest();
    xhttp.addEventListener("readystatechange", handle_response, false);
    xhttp.open("POST", "store_score", true);
    xhttp.send(data)
}

function handle_response() {
    // Check that the response has fully arrived
    if ( xhttp.readyState === 4 ) {
        // Check the request was successful
        if ( xhttp.status === 200 ) {
            if ( xhttp.responseText === "success" ) {
                // score was successfully stored in database
                console.log("Yes")
            } else {
                // score was not successfully stored in database
                console.log("No")
            }
        }
    }
}