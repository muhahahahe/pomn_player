import { MODULE_NAME } from './constants.js';
import { io } from 'socket.io-client';

export class PomnWebSocket {
	guild;
	token;
	address;
	port;
	secure;
	onMusicPlayerStateReceived;
	socket = null;
	constructor(guild, token, onMusicPlayerStateReceived) {
		this.guild = guild;
		this.token = token;
		this.address = game.settings.get(MODULE_NAME, 'address');
		this.port = game.settings.get(MODULE_NAME, 'port');
		this.secure = game.settings.get(MODULE_NAME, 'secure');
		this.onMusicPlayerStateReceived = onMusicPlayerStateReceived;
	}
	async connect() {
		try {
			const protocol = this.secure ? 'https' : 'http';
			this.socket = io(`${protocol}://${this.address}:${this.port}`, {
				auth: {
					token: this.token,
					guildId: this.guild,
					client: 'POMN_Player FoundryVTT',
				},
			});
			this.socket.on('connected', (state) => this.onMusicPlayerStateReceived('connected', state));
			this.socket.on('disconnected', () => this.onMusicPlayerStateReceived('disconnected'));
			this.socket.on('idle', (state, track) => this.onMusicPlayerStateReceived('idle', state, track));
			this.socket.on('playing', (state, track) => this.onMusicPlayerStateReceived('playing', state, track));
			this.socket.on('paused', (state, track) => this.onMusicPlayerStateReceived('paused', state, track));
			this.socket.on('statechange', (state, track) => this.onMusicPlayerStateReceived('statechange', state, track));
			this.socket.on('error', this.onError.bind(this));
		} catch (err) {
			console.error(`Failed to connect: ${err.message}`);
		}
	}

	onError() {
		console.error('An error occured with pomn_player!');
	}
}
