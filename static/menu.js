// Google prevents auto play https://developer.chrome.com/blog/autoplay/
// how to make sound https://stackoverflow.com/questions/9419263/how-to-play-audio
// main menu music https://artlist.io/royalty-free-music/song/the-last-dance/129853

let main_menu_music = new Audio();

load_assets([
    { "var": main_menu_music, "url": "static/music/2050-The_Last_Dance.mp3" },
], init);

function init() {
    document.addEventListener("click", function () {
        playSound(main_menu_music);
    });
}

function playSound(sound) {
    if (sound.paused) {
        sound.play().catch(error => {
            console.error("Error playing sound:", error);
        });
    }
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