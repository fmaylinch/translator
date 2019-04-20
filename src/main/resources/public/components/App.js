
class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            en: "",
            ru: "",
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

                const stateUpdate = {};
                stateUpdate[to] = translation.text;
                this.setState(stateUpdate);
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

    handleChange(e, stateField) {

        const stateUpdate = {};
        stateUpdate[stateField] = e.target.value;
        this.setState(stateUpdate);
    }

    render() {

        return (
            <div className="siimple-content siimple-content--extra-large">
                <div className="siimple-form">
                    <div className="siimple-form-title">Translator</div>
                    <div className="siimple-form-detail">
                        Powered by <a href="https://translate.yandex.com/">Yandex</a> and <a href="https://www.readspeaker.com/">ReadSpeaker</a>
                    </div>
                    <div className="siimple-form-field">
                        <textarea type="text" className="siimple-textarea siimple-textarea--fluid"
                               rows="4"
                               placeholder="English text"
                               value={this.state.en}
                               onChange={(e) => this.handleChange(e, "en")}
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
                        <textarea type="text" className="siimple-textarea siimple-textarea--fluid"
                               rows="4"
                               placeholder="Russian text"
                               value={this.state.ru}
                               onChange={(e) => this.handleChange(e, "ru")}
                        />
                    </div>
                    <div className="siimple-form-field">
                        <div className="siimple-form-field-label">Yandex ID</div>
                        <input type="text" className="siimple-input siimple-input--fluid"
                               value={this.state.yandexId}
                               onChange={(e) => this.handleChange(e, "yandexId")} />
                    </div>
                </div>
            </div>
        );
    }
}
