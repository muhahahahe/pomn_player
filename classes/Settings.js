import { MODULE_NAME } from "./constants.js";
export class Settings {
    static registerSettings() {
        game.settings.register(MODULE_NAME, "guild", {
            name: "Guild ID",
            hint: "The ID of the Discord guild to connect to",
            scope: "world",
            type: String,
            config: true,
            default: "",
        });
        game.settings.register(MODULE_NAME, "token", {
            name: "Token",
            hint: "The secret token for the Discord bot",
            scope: "world",
            type: String,
            config: true,
            default: "",
        });
        game.settings.registerMenu(MODULE_NAME, "test-connection", {
            name: "Test Connection",
            label: "Test Connection",
            hint: "Click to test the Discord bot connection.",
            icon: "fas fa-network-wired",
            type: TestConnectionForm,
            restricted: true,
        });
    }
}
class TestConnectionForm extends FormApplication {
    _updateObject(event, formData) {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super({});
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "test-connection-form",
            title: "Test Connection",
            template: "modules/pomn_player/templates/test-connection.html",
            width: 400,
            height: "auto",
            classes: ["sheet"],
            resizable: true,
            closeOnSubmit: false,
        });
    }
    getData() {
        return { result: "" };
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find("#test-connection-button").on("click", async () => {
            const guild = game.settings.get(MODULE_NAME, "guild");
            const token = game.settings.get(MODULE_NAME, "token");
            try {
                const socket = new WebSocket(`wss://ws.playfoundry.pw:3000?token=${token}&guild=${guild}&test=true`);
                socket.addEventListener("message", (event) => {
                    const data = JSON.parse(event.data);
                    if (data.success) {
                        ui.notifications.info(`Successfully connected to "${data.guildName}"`);
                        this._onSuccess(`Successfully connected to "${data.guildName}"`);
                    }
                    else {
                        ui.notifications.warn(`Failed to connect: ${data.error}`);
                        this._onFailure(`Failed to connect: ${data.error}`);
                    }
                    socket.close();
                    this._resizeParentElement();
                });
                socket.addEventListener("error", () => {
                    ui.notifications.error("Failed to connect: websocket error");
                    this._onFailure("Failed to connect: websocket error");
                    this._resizeParentElement();
                });
            }
            catch (err) {
                ui.notifications.error(`Failed to connect: ${err.message}`);
                this._onFailure(err.message);
                this._resizeParentElement();
            }
        });
    }
    _onSuccess(message) {
        const resultEl = this.element.find("#test-connection-result");
        resultEl.removeClass("error");
        resultEl.text(message);
    }
    _onFailure(message) {
        const resultEl = this.element.find("#test-connection-result");
        resultEl.addClass("error");
        resultEl.text(message);
    }
    _resizeParentElement() {
        const resultEl = this.element.find("#test-connection-result");
        const parentEl = resultEl.parent();
        parentEl.css("height", "");
        parentEl.css("height", `${resultEl.outerHeight()}px`);
    }
}
