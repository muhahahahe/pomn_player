import { MODULE_NAME } from "./constants.js";
export class MediaPlayer {
    html;
    playerHtml = $(`
        <div class="pomn-media-controls">
            <div class="pomn-button-controls">
                <button class="pomn-play-button">
                    <i class="fas fa-play"></i>
                </button>
                <button class="pomn-pause-button">
                    <i class="fas fa-pause"></i>
                </button>
                <button class="pomn-stop-button">
                    <i class="fas fa-stop"></i>
                </button>
                <button class="pomn-skip-button">
                    <i class="fas fa-forward"></i>
                </button>
            </div>
            <div class="pomn-search-controls">
                <div class="pomn-media-search">
                    <input type="text" class="pomn-search-input" placeholder="Search...">
                </div>
            </div>
        </div>
    `);
    ws;
    token;
    guild;
    constructor(html) {
        this.html = html;
        this.token = game.settings.get(MODULE_NAME, "token");
        this.guild = game.settings.get(MODULE_NAME, "guild");
    }
    render() {
        console.log(this.html);
        this.html.find('nav').after(this.playerHtml);
        this.attachEventListeners();
    }
    attachEventListeners() {
        this.playerHtml.find('.pomn-play-button').on('click', () => {
            this.sendWebSocketMessage('play');
        });
        this.playerHtml.find('.pomn-pause-button').on('click', () => {
            this.sendWebSocketMessage('pause');
        });
        this.playerHtml.find('.pomn-stop-button').on('click', () => {
            this.sendWebSocketMessage('stop');
        });
        this.playerHtml.find('.pomn-skip-button').on('click', () => {
            this.sendWebSocketMessage('skip');
        });
        this.playerHtml.find('.pomn-search-input').on('keydown', (event) => {
            if (event.keyCode === 13) {
                const text = event.target.value;
                this.sendWebSocketMessage(text);
                event.target.value = '';
            }
        });
    }
    establishWebSocketConnection() {
        if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
            this.ws = new WebSocket(`wss://ws.playfoundry.pw:3000?token=${this.token}&guild=${this.guild}`);
            this.ws.onopen = () => {
                console.log('WebSocket connection established');
            };
            this.ws.onclose = () => {
                console.log('WebSocket connection closed');
                this.ws = undefined;
            };
            this.ws.onmessage = (event) => {
                console.log(`WebSocket message received: ${event.data}`);
                if (event.data === 'notConnected') {
                    ui.notifications.warn("POMN is not connected to a voice channel!");
                }
            };
        }
    }
    sendWebSocketMessage(message) {
        if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
            this.establishWebSocketConnection();
        }
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        }
        else {
            console.log('WebSocket connection not open');
        }
    }
    play() {
        this.sendWebSocketMessage('play');
    }
    pause() {
        this.sendWebSocketMessage('pause');
    }
    stop() {
        this.sendWebSocketMessage('stop');
    }
    skip() {
        this.sendWebSocketMessage('skip');
    }
    sendText(text) {
        this.sendWebSocketMessage(text);
    }
}
