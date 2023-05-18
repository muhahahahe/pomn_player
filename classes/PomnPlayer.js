import { MODULE_NAME } from "./constants.js";
import { PomnWebSocket } from "./PomnWebSocket.js";
export class PomnPlayer extends FormApplication {
    playerState;
    guild;
    token;
    webSocket = null;
    constructor(guild, token) {
        super({});
        this.playerState = {
            track: null,
            status: 'unknown',
            loop: 'off',
            volume: 50,
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
            setTimeout(() => { }, 10000);
            if (this.playerState.track && this.playerState.track?.title !== 'unknown') {
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
        if (this.playerState.status === 'PLAYING') {
            this.webSocket?.send('pause');
        }
        if (this.playerState.status === 'PAUSED') {
            this.webSocket?.send('play');
        }
    }
    _onStopButtonClick(event) {
        event.preventDefault();
        this.webSocket?.send('stop');
    }
    _onSkipButtonClick(event) {
        event.preventDefault();
        this.webSocket?.send('skip');
    }
    _onRepeatSingleButtonClick(event) {
        event.preventDefault();
        this.webSocket?.send('loopSingle');
    }
    _onRepeatAllButtonClick(event) {
        event.preventDefault();
        this.webSocket?.send('loopAll');
    }
    _onShuffleButtonClick(event) {
        event.preventDefault();
        this.webSocket?.send('shuffle');
    }
    _onSearchFieldKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const search = event.target;
            this.webSocket?.send(`+ ${search.value}`);
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
        this.webSocket?.send(`v ${this.playerState.volume}`);
    }
    _onMusicPlayerStateReceived(state) {
        this.playerState = state;
        if (state.message === 'disconnect') {
            this.element.find('#pomn-path-status').attr('fill', '#FF0000');
            this.webSocket?.close();
        }
        if (state.message === 'connect') {
            this.element.find('#pomn-path-status').attr('fill', '#00FF00');
        }
        if (state.message === 'notConnected') {
            this.element.find('#pomn-path-status').attr('fill', '#FF0000');
        }
        if (this.playerState.status !== 'DISCONNECTED') {
            this.element.find('#pomn-path-status').attr('fill', '#FF0000');
        }
        this.updateHtml();
    }
    async _updateObject(event, formData) {
    }
    updateHtml() {
        const html = this.element;
        const thumbnail = html.find('.pomn-interface-thumbnail');
        if (this.playerState.track?.thumbnail && this.playerState.track?.thumbnail !== 'unknown') {
            const img = document.createElement('img');
            img.src = this.playerState.track?.thumbnail;
            thumbnail.empty().append(img);
        }
        else {
            thumbnail.empty();
        }
        if (this.playerState.loop === 'Single') {
            const buttonSingle = html.find('#pomn-repeat-single-button');
            buttonSingle.find('path').attr('fill', '#301934');
            const buttonAll = html.find('#pomn-repeat-all-button');
            buttonAll.find('path').attr('fill', '#000000');
        }
        if (this.playerState.loop === 'All') {
            const buttonSingle = html.find('#pomn-repeat-single-button');
            buttonSingle.find('path').attr('fill', '#000000');
            const buttonAll = html.find('#pomn-repeat-all-button');
            buttonAll.find('path').attr('fill', '#301934');
        }
        if (this.playerState.loop === 'Off') {
            const buttonSingle = html.find('#pomn-repeat-single-button');
            buttonSingle.find('path').attr('fill', '#000000');
            const buttonAll = html.find('#pomn-repeat-all-button');
            buttonAll.find('path').attr('fill', '#000000');
        }
        const repeat = html.find('.pomn-player-interface-repeat');
        repeat.text(this.playerState.loop);
        const duration = html.find('.pomn-player-interface-duration');
        if (this.playerState.track?.duration && this.playerState.track?.duration !== 0) {
            duration.text(parseDuration(this.playerState.track?.duration));
        }
        else {
            duration.text('');
        }
        const title = html.find('#pomn-interface-search');
        if (this.playerState.track && this.playerState.track?.title !== 'unknown') {
            title.attr('placeholder', this.playerState.track.title);
        }
        else {
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
        if (this.playerState.status === 'PLAYING') {
            svgPlayPause.empty();
            const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path1.setAttribute('d', 'M10,17.9H6.3c-0.6,0-1.2-0.5-1.2-1.2V7.4c0-0.6,0.5-1.2,1.2-1.2H10c0.6,0,1.2,0.5,1.2,1.2v9.4C11.2,17.4,10.7,17.9,10,17.9z');
            const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path2.setAttribute('d', 'M17.9,17.9h-3.8c-0.6,0-1.2-0.5-1.2-1.2V7.4c0-0.6,0.5-1.2,1.2-1.2h3.8c0.6,0,1.2,0.5,1.2,1.2v9.4C19.1,17.4,18.6,17.9,17.9,17.9z');
            svgPlayPause.append(path1);
            svgPlayPause.append(path2);
        }
        else {
            svgPlayPause.empty();
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M18.5,11.8L9.2,6.4C9,6.3,8.7,6.5,8.7,6.7v10.7c0,0.3,0.3,0.5,0.5,0.3l9.3-5.3C18.7,12.3,18.7,11.9,18.5,11.8z');
            svgPlayPause.append(path);
        }
    }
    async connect() {
        if (this.webSocket && this.webSocket.getReadyState() === WebSocket.OPEN) {
            return;
        }
        else {
            const guild = game.settings.get(MODULE_NAME, "guild") || this.guild;
            const token = game.settings.get(MODULE_NAME, "token") || this.token;
            if (!guild || !token || guild.trim() === '' || token.trim() === '') {
                console.warn("Guild and/or Token settings are not set");
            }
            else {
                this.webSocket = new PomnWebSocket(guild, token, this._onMusicPlayerStateReceived.bind(this));
                await this.webSocket.connect();
            }
        }
    }
}
function parseDuration(duration) {
    let time;
    if (duration > 3600) {
        time = new Date(duration).toISOString().substring(11, 19);
    }
    else {
        time = new Date(duration).toISOString().substring(14, 19);
    }
    return time;
}
