import { MODULE_NAME } from './constants.js';
import { io } from 'socket.io-client';

export class Settings {
	static registerSettings() {
		game.settings.register(MODULE_NAME, 'address', {
			name: 'Address',
			hint: 'The web address that pomn_music listens on (without http > www.mywebadress.com)',
			scope: 'world',
			type: String,
			config: true,
			default: '',
		});
		game.settings.register(MODULE_NAME, 'port', {
			name: 'Port',
			hint: 'The port that you have set in the config.json (default: 3000)',
			scope: 'world',
			type: Number,
			config: true,
			default: 3000,
		});
		game.settings.register(MODULE_NAME, 'secure', {
			name: 'Secure',
			hint: 'Whether you use a secure connection',
			scope: 'world',
			type: Boolean,
			config: true,
			default: true,
		});
		game.settings.register(MODULE_NAME, 'guild', {
			name: 'Guild ID',
			hint: 'The ID of the Discord guild to connect to',
			scope: 'world',
			type: String,
			config: true,
			default: '',
		});
		game.settings.register(MODULE_NAME, 'token', {
			name: 'Token',
			hint: 'The secret token for the Discord bot',
			scope: 'world',
			type: String,
			config: true,
			default: '',
		});
		game.settings.registerMenu(MODULE_NAME, 'test-connection', {
			name: 'Test Connection',
			label: 'Test Connection',
			hint: 'Click to test the Discord bot connection.',
			icon: 'fas fa-network-wired',
			type: TestConnectionForm,
			restricted: true,
		});
	}
}
class TestConnectionForm extends FormApplication {
	_updateObject(event, formData) {
		throw new Error('Method not implemented.');
	}
	success = false;
	guild = game.settings.get(MODULE_NAME, 'guild');
	constructor() {
		super({});
	}
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: 'test-connection-form',
			title: 'Test Connection',
			template: 'modules/pomn_player/templates/test-connection.html',
			width: 400,
			height: 'auto',
			classes: ['sheet'],
			resizable: true,
			closeOnSubmit: false,
		});
	}
	getData() {
		return { result: '' };
	}
	activateListeners(html) {
		super.activateListeners(html);
		html.find('#test-connection-button').on('click', async () => {
			const token = game.settings.get(MODULE_NAME, 'token');
			const address = game.settings.get(MODULE_NAME, 'address');
			const port = game.settings.get(MODULE_NAME, 'port');
			const secure = game.settings.get(MODULE_NAME, 'secure');
			const protocol = secure ? 'https' : 'http';
			try {
				const socket = io(`${protocol}://${address}:${port}`, {
					auth: {
						token: token,
						guildId: this.guild,
						client: 'POMN_Player FoundryVTT',
					},
				});
				socket.emit('test');

				socket.on('success', () => {
					this.success = true;
					this._onSuccess(`Successfully connected to ${this.guild}`);
				});

				setTimeout(() => this._onFailure(`Failed to connect to ${this.guild}`), 20000);
			} catch (err) {
				this._onFailure(err.message);
			}
		});
	}
	_onSuccess(message) {
		ui.notifications.info(`Successfully connected to ${this.guild}`);
		const resultEl = this.element.find('#test-connection-result');
		resultEl.removeClass('error');
		resultEl.text(message);
		this._resizeParentElement();
	}
	_onFailure(message) {
		if (this.success) return;
		ui.notifications.error(`Failed to connect to ${this.guild}`);
		const resultEl = this.element.find('#test-connection-result');
		resultEl.addClass('error');
		resultEl.text(message);
		this._resizeParentElement();
	}
	_resizeParentElement() {
		const resultEl = this.element.find('#test-connection-result');
		const parentEl = resultEl.parent();
		parentEl.css('height', '');
		parentEl.css('height', `${resultEl.outerHeight()}px`);
	}
}
