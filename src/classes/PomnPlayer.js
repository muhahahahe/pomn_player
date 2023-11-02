import { MODULE_NAME } from './constants.js';
import { PomnWebSocket } from './PomnWebSocket.js';
export class PomnPlayer extends FormApplication {
	playerState;
	guild;
	token;
	webSocket = null;
	constructor(guild, token) {
		super({});
		this.playerState = {
			track: null,
			connected: false,
			playing: false,
			paused: false,
			stopped: true,
			repeat: false,
			repeatAll: false,
			volume: 50,
			idletime: 0,
		};
		this.guild = guild;
		this.token = token;
		if (guild && token) {
			this.connect();
		}
		this.activateListeners(this.element);
		this.changeSearchTitle();
	}
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: 'pomn-player',
			title: 'Pomn Player',
			template: 'modules/pomn_player/templates/pomn-player.html',
			classes: ['sheet'],
			width: 340,
			height: 210,
			overflow: 'hidden',
			dragable: true,
		});
	}
	changeSearchTitle() {
		const search = this.element.find('#pomn-interface-search');
		setInterval(() => {
			search.attr('placeholder', 'search here');
			setTimeout(() => {}, 10000);
			if (this.playerState.track) {
				search.attr('placeholder', this.playerState.track.title);
			}
		}, 180000);
	}
	activateListeners(html) {
		super.activateListeners(html);
		html.find('#pomn-play-pause-button').on('click', this._onPlayPauseButtonClick.bind(this));
		html.find('#pomn-stop-button').on('click', this._onStopButtonClick.bind(this));
		html.find('#pomn-skip-button').on('click', this._onSkipButtonClick.bind(this));
		html.find('#pomn-repeat-single-button').on('click', this._onRepeatSingleButtonClick.bind(this));
		html.find('#pomn-repeat-all-button').on('click', this._onRepeatAllButtonClick.bind(this));
		html.find('#pomn-shuffle-button').on('click', this._onShuffleButtonClick.bind(this));
		html.find('#pomn-interface-search').on('keypress', this._onSearchFieldKeyPress.bind(this));
		html.find('#pomn-volume-slider').on('input', this._onVolumeSliderChange.bind(this));
		html.find('#pomn-volume-slider').on('mouseup', this._onVolumeSliderEnd.bind(this));
	}
	_onPlayPauseButtonClick(event) {
		event.preventDefault();
		this.webSocket?.emit('pause');
	}
	_onStopButtonClick(event) {
		event.preventDefault();
		this.webSocket?.emit('stop');
	}
	_onSkipButtonClick(event) {
		event.preventDefault();
		this.webSocket?.emit('skip');
	}
	_onRepeatSingleButtonClick(event) {
		event.preventDefault();
		this.webSocket?.emit('repeat');
	}
	_onRepeatAllButtonClick(event) {
		event.preventDefault();
		this.webSocket?.emit('repeatall');
	}
	_onShuffleButtonClick(event) {
		event.preventDefault();
		this.webSocket?.emit('shuffle');
	}
	_onSearchFieldKeyPress(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			const search = event.target;
			this.webSocket?.emit('search', search.value);
			event.target.value = '';
		}
	}
	_onVolumeSliderChange(event) {
		event.preventDefault();
		let volume = parseInt(event.target.value);
		this.playerState.volume = volume;
		const slider = this.element.find('#pomn-volume-slider');
		const sliderWidth = slider.width();
		const customSlider = this.element.find('#pomn-volume-indicator');
		const customSliderWidth = customSlider.width();
		const leftPosition = (volume / 100) * ((sliderWidth || 0) - (customSliderWidth || 0));
		customSlider.css('left', `${leftPosition}px`);
	}
	_onVolumeSliderEnd(event) {
		event.preventDefault();
		this.webSocket?.emit('volume', this.playerState.volume);
	}
	_onMusicPlayerStateReceived(event, state, track) {
		switch (event) {
			case 'connected':
			case 'idle':
			case 'playing':
			case 'paused':
			case 'statechange':
				this.playerState = { ...this.playerState, ...state };
				if (track) {
					this.playerState.track = track;
				}
				break;
			case 'disconnected':
				this.element.find('#pomn-path-status').attr('fill', '#FF0000');
				this.webSocket?.close();
				break;
			default:
				console.error(`Unknown event: ${event}`);
		}

		if (this.playerState.connected) {
			this.element.find('#pomn-path-status').attr('fill', '#00FF00');
		} else {
			this.element.find('#pomn-path-status').attr('fill', '#FF0000');
		}

		this.updateHtml();
	}
	updateHtml() {
		const html = this.element;
		const thumbnail = html.find('.pomn-interface-thumbnail');
		if (this.playerState.track?.thumbnail) {
			const img = document.createElement('img');
			img.src = this.playerState.track.thumbnail;
			thumbnail.empty().append(img);
		} else {
			thumbnail.empty();
		}
		const repeat = html.find('.pomn-player-interface-repeat');
		if (this.playerState.repeat) {
			const buttonSingle = html.find('#pomn-repeat-single-button');
			buttonSingle.find('path').attr('fill', '#301934');
			const buttonAll = html.find('#pomn-repeat-all-button');
			buttonAll.find('path').attr('fill', '#000000');
			repeat.text('Single');
		} else if (this.playerState.repeatAll) {
			const buttonSingle = html.find('#pomn-repeat-single-button');
			buttonSingle.find('path').attr('fill', '#000000');
			const buttonAll = html.find('#pomn-repeat-all-button');
			buttonAll.find('path').attr('fill', '#301934');
			repeat.text('All');
		} else {
			const buttonSingle = html.find('#pomn-repeat-single-button');
			buttonSingle.find('path').attr('fill', '#000000');
			const buttonAll = html.find('#pomn-repeat-all-button');
			buttonAll.find('path').attr('fill', '#000000');
			repeat.text('Off');
		}
		const duration = html.find('.pomn-player-interface-duration');
		if (this.playerState.track?.durationInSec) {
			duration.text(secondsToTime(this.playerState.track.duration));
		} else {
			duration.text('');
		}
		const title = html.find('#pomn-interface-search');
		if (this.playerState.track?.title) {
			title.attr('placeholder', this.playerState.track.title);
		} else {
			title.attr('placeholder', 'search here');
		}
		const volume = html.find('#pomn-volume-slider');
		volume.val(this.playerState.volume);
		const slider = this.element.find('#pomn-volume-slider');
		const sliderWidth = slider.width();
		const customSlider = this.element.find('#pomn-volume-indicator');
		const customSliderWidth = customSlider.width();
		const leftPosition = (this.playerState.volume / 100) * ((sliderWidth || 0) - (customSliderWidth || 0));
		customSlider.css('left', `${leftPosition}px`);
		const svgPlayPause = html.find('#pomn-play-pause-button');
		if (this.playerState.playing) {
			svgPlayPause.empty();
			const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			path1.setAttribute(
				'd',
				'M10,17.9H6.3c-0.6,0-1.2-0.5-1.2-1.2V7.4c0-0.6,0.5-1.2,1.2-1.2H10c0.6,0,1.2,0.5,1.2,1.2v9.4C11.2,17.4,10.7,17.9,10,17.9z'
			);
			const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			path2.setAttribute(
				'd',
				'M17.9,17.9h-3.8c-0.6,0-1.2-0.5-1.2-1.2V7.4c0-0.6,0.5-1.2,1.2-1.2h3.8c0.6,0,1.2,0.5,1.2,1.2v9.4C19.1,17.4,18.6,17.9,17.9,17.9z'
			);
			svgPlayPause.append(path1);
			svgPlayPause.append(path2);
		} else {
			svgPlayPause.empty();
			const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			path.setAttribute('d', 'M18.5,11.8L9.2,6.4C9,6.3,8.7,6.5,8.7,6.7v10.7c0,0.3,0.3,0.5,0.5,0.3l9.3-5.3C18.7,12.3,18.7,11.9,18.5,11.8z');
			svgPlayPause.append(path);
		}
	}
	async connect() {
		if (this.webSocket && this.webSocket.connected) {
			return;
		} else {
			const guild = game.settings.get(MODULE_NAME, 'guild') || this.guild;
			const token = game.settings.get(MODULE_NAME, 'token') || this.token;
			const address = game.settings.get(MODULE_NAME, 'address');
			if (!guild || guild.trim() === '') {
				console.warn('Guild is not set');
			} else if (!token || token.trim() === '') {
				console.warn('Token is not set');
			} else if (!address || address.trim() === '') {
				console.warn('Address is not set');
			} else {
				this.webSocket = new PomnWebSocket(guild, token, this._onMusicPlayerStateReceived.bind(this));
				await this.webSocket.connect();
			}
		}
	}
}
function secondsToTime(seconds) {
	const date = new Date(0);
	date.setSeconds(seconds);
	let time = date.toISOString().substr(11, 8);
	if (time.startsWith('00:')) time = time.substr(3);
	return time;
}
