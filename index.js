import { Settings } from "./classes/Settings.js";
import { PomnPlayer } from "./classes/PomnPlayer.js";
import { MODULE_NAME } from "./classes/constants.js";
Hooks.once("init", () => {
    console.log(`${MODULE_NAME} | Initializing ${MODULE_NAME}`);
    Settings.registerSettings();
});
Hooks.on("getSceneControlButtons", (controls) => {
    const pomnPlayer = {
        icon: "fas fa-radio",
        name: "pomn_player",
        title: "Pomn Player",
        visible: true,
        button: true,
        toggle: false,
        onClick: async () => {
            const guild = game.settings.get(MODULE_NAME, "guild") || '';
            const token = game.settings.get(MODULE_NAME, "token") || '';
            const pomnPlayer = new PomnPlayer(guild, token);
            await pomnPlayer.render(true);
            pomnPlayer.updateHtml();
        }
    };
    controls.find(c => c.name === "sounds")?.tools.push(pomnPlayer);
});
Hooks.on("ready", async () => {
    if (game.user?.isGM) {
        const guild = game.settings.get(MODULE_NAME, "guild") || '';
        const token = game.settings.get(MODULE_NAME, "token") || '';
        const pomnPlayer = new PomnPlayer(guild, token);
        await pomnPlayer.render(true);
        pomnPlayer.updateHtml();
    }
});
