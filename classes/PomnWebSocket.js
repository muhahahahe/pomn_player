export class PomnWebSocket {
    guild;
    token;
    onMusicPlayerStateReceived;
    socket = null;
    constructor(guild, token, onMusicPlayerStateReceived) {
        this.guild = guild;
        this.token = token;
        this.onMusicPlayerStateReceived = onMusicPlayerStateReceived;
    }
    async connect() {
        try {
            this.socket = new WebSocket(`wss://ws.playfoundry.pw:3000?token=${this.token}&guild=${this.guild}`);
            this.socket.addEventListener("message", this.onMessage.bind(this));
            this.socket.addEventListener("error", this.onError.bind(this));
        }
        catch (err) {
            console.error(`Failed to connect: \${err.message}`);
        }
    }
    close() {
        if (this.socket) {
            this.socket.close();
        }
    }
    send(data) {
        if (this.socket) {
            this.socket.send(data);
        }
        else {
            this.connect();
        }
    }
    getReadyState() {
        return this.socket ? this.socket.readyState : null;
    }
    onMessage(event) {
        const data = JSON.parse(event.data);
        this.onMusicPlayerStateReceived(data);
    }
    onError() {
        console.error("Failed to connect: websocket error");
    }
}
