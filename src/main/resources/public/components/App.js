
class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            en: "",
            ru: "",
            autoCopyRussian: true,
            yandexId: "26e324a6.5cbb1afa.3ee63c8f-0-0",
            mp3ru: null,
        }

        this.audioRef = React.createRef();
    }

    translate(from, to) {

        let translateReq = {
            text: this.state[from],
            from: from,
            to: to,
            id: this.state.yandexId
        };

        axios.post("/api/translator/translate", translateReq)
            .then(response => {

                const translation = response.data;
                console.log("Translation response", translation);
                this.setState({[to]: translation.text}, () => {
                    if (this.state.autoCopyRussian) {
                        this.copyToClipboard(this.state.ru);
                    }
                });
            });
    }

    loadRussianAudio() {

        let ttsReq = {
            text: this.state.ru,
            voice: "Russian - female"
        };

        axios.post("/api/translator/text-to-speech", ttsReq)
            .then(response => {

                const ttsResp = response.data;
                console.log("TTS response", ttsResp);

                this.setState({mp3ru: ttsResp.mp3}, () => {
                    this.audioRef.current.load();
                });
            });
    }

    copyToClipboard(str) {

        // https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
        const el = document.createElement('textarea');
        el.value = str;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    };

    handleChange(e) {

        const target = e.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        this.setState({[target.name]: value});
    }

    render() {

        return (
            <div className="siimple-content siimple-content--extra-large">
                <div className="siimple-form">
                    <div className="siimple-form-field">
                        <textarea
                            className="siimple-textarea siimple-textarea--fluid"
                            rows="4"
                            placeholder="English text"
                            value={this.state.en}
                            name="en"
                            onChange={(e) => this.handleChange(e)}
                        />
                    </div>
                    <div className="siimple-form-field">
                        <div className="siimple-btn siimple-btn--primary"
                             onClick={() => this.translate("en", "ru")}>EN to RU</div>
                    </div>
                    <div className="siimple-form-field">
                        <div className="siimple-btn siimple-btn--primary"
                             onClick={() => this.translate("ru", "en")}>RU to EN</div>
                        &nbsp;
                        <div className="siimple-btn siimple-btn--primary"
                             onClick={() => this.loadRussianAudio()}>Load audio</div>
                    </div>
                    <div className="siimple-form-field">
                        <audio controls ref={this.audioRef}>
                            <source src={this.state.mp3ru} type="audio/mpeg" />
                        </audio>
                    </div>
                    <div className="siimple-form-field">
                        <textarea
                            type="text"
                            className="siimple-textarea siimple-textarea--fluid"
                            rows="4"
                            placeholder="Russian text"
                            value={this.state.ru}
                            name="ru"
                            onChange={(e) => this.handleChange(e)}
                        />
                    </div>
                    <div className="siimple-form-field">
                        <label className="siimple-label">Auto-copy Russian</label>
                        <div className="siimple-checkbox">
                            <input type="checkbox"
                                   id="autoCopyRussian"
                                   checked={this.state.autoCopyRussian}
                                   name="autoCopyRussian"
                                   onChange={(e) => this.handleChange(e)}
                            />
                            <label htmlFor="autoCopyRussian"></label>
                        </div>
                    </div>
                    <div className="siimple-form-field">
                        <div className="siimple-form-field-label">Yandex ID</div>
                        <input type="text"
                               className="siimple-input siimple-input--fluid"
                               value={this.state.yandexId}
                               name="yandexId"
                               onChange={(e) => this.handleChange(e)} />
                    </div>
                    <div className="siimple-form-title">Translator</div>
                    <div className="siimple-form-detail">
                        Powered by <a href="https://translate.yandex.com/">Yandex</a> and <a href="https://www.readspeaker.com/">ReadSpeaker</a>
                    </div>
                </div>
            </div>
        );
    }
}
