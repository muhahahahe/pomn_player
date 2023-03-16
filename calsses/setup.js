import { Settings } from "./settings.js";
import { MediaPlayer } from "./MediaPlayer.js";
import { MODULE_NAME } from "./constants.js";
console.log('hello world');
Hooks.once("init", function () {
    console.log(`${MODULE_NAME} | Initializing ${MODULE_NAME}`);
    Settings.registerSettings();
});
Hooks.on("ready", () => {
    Hooks.on("renderCameraViews", (app, html, data) => {
        if (game.user?.isGM) {
            const mediaPlayer = new MediaPlayer(html);
            mediaPlayer.render();
        }
    });
});
