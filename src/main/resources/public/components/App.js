
class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            other: "",
            ru: "",
            yandexId: "26e324a6.5cbb1afa.3ee63c8f-0-0",
            mp3ru: null,
            loading: false,
            append: true
        };

        this.audioRef = React.createRef();
        this.russianRef = React.createRef();
    }

    translate(from, to) {

        // This a bit of a hack
        // All languages other than "ru" are written in "other"
        const stateFrom = from === "ru" ? "ru" : "other";
        const stateTo = to === "ru" ? "ru" : "other";

        let translateReq = {
            text: this.state[stateFrom],
            from: from,
            to: to,
            id: this.state.yandexId
        };

        this.setState({loading: true});

        axios.post("/api/translator/translate", translateReq)
            .then(response => {

                const translation = response.data;
                console.log("Translation response", translation);

                let finalText = this.buildText(this.state[stateTo], translation.text);

                this.setState({[stateTo]: finalText, loading: false});
            });
    }

    buildText(currentText, newText) {

        if (!this.state.append) return newText;

        const separation = currentText.length > 0 ? " " : "";
        return currentText + separation + newText;
    }

    loadRussianAudio() {

        let ttsReq = {
            text: this.state.ru,
            voice: "Russian - female"
        };

        this.setState({loading: true});

        axios.post("/api/translator/text-to-speech", ttsReq)
            .then(response => {

                const ttsResp = response.data;
                console.log("TTS response", ttsResp);

                this.setState({mp3ru: ttsResp.mp3, loading: false}, () => {
                    this.audioRef.current.load();
                });
            });
    }

    classForBtn(otherClasses) {
        return "siimple-btn " + otherClasses + (this.state.loading ? " siimple-btn--disabled" : "");
    }

    copyRussian() {

        const el = this.russianRef.current;

        // https://stackoverflow.com/a/7436574/1121497
        setTimeout(() => {
            el.select();
            el.setSelectionRange(0, 9999);
            document.execCommand('copy');
        }, 0.5);
    }

    /** Updates state.NAME field with value of input, where NAME is taken from the input name attribute */
    onInputChange(e) {

        const target = e.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        this.setState({[target.name]: value});
    }

    clearValue(name) {

        this.setState({[name]: ""});
    }

    render() {

        return (
            <div className="siimple-content siimple-content--extra-large">
                <div className="siimple-form">

                    <div className="siimple-form-field">
                        <textarea
                            className="siimple-textarea siimple-textarea--fluid"
                            rows="4"
                            placeholder="English / Spanish"
                            value={this.state.other}
                            name="other"
                            onChange={(e) => this.onInputChange(e)}
                        />
                        <div className="button-bar-bottom">
                            <div className={this.classForBtn("siimple-btn--primary")}
                                 onClick={() => this.translate("en", "ru")}>en &gt; ru</div>
                            <div className={this.classForBtn("siimple-btn--success")}
                                 onClick={() => this.translate("es", "ru")}>es &gt; ru</div>
                            <div className="siimple-btn siimple-btn--error"
                                 onClick={() => this.clearValue("other")}>Clear</div>
                        </div>
                    </div>

                    <div className="siimple-form-field">
                        <div className="button-bar-top">
                            <div className={this.classForBtn("siimple-btn--primary")}
                                 onClick={() => this.translate("ru", "en")}>ru &gt; en</div>
                            <div className={this.classForBtn("siimple-btn--success")}
                                 onClick={() => this.translate("ru", "es")}>ru &gt; es</div>
                            <div className="siimple-btn siimple-btn--error"
                                 onClick={() => this.clearValue("ru")}>Clear</div>
                            <div className="siimple-btn siimple-btn--warning"
                                 onClick={() => this.copyRussian()}>Copy</div>
                        </div>
                        <textarea
                            id="ru-text"
                            className="siimple-textarea siimple-textarea--fluid"
                            rows="4"
                            placeholder="Russian"
                            value={this.state.ru}
                            ref={this.russianRef}
                            name="ru"
                            onChange={(e) => this.onInputChange(e)}
                        />
                    </div>

                    <div className="siimple-form-field">
                        <div className="button-bar-top">
                            <div className={this.classForBtn("siimple-btn--primary")}
                                 onClick={() => this.loadRussianAudio()}>Load audio</div>
                            <a href={this.state.mp3ru}>
                                {this.state.mp3ru ? this.state.mp3ru.replace("https://media.readspeaker.com/cache/", "") : ""}
                            </a>
                        </div>
                        <audio controls ref={this.audioRef}>
                            <source src={this.state.mp3ru} type="audio/mpeg" />
                        </audio>
                    </div>

                    <div className="siimple-form-title">Translator</div>
                    <div className="siimple-form-detail">
                        Powered by <a href="https://translate.yandex.com/">Yandex</a> and <a href="https://www.readspeaker.com/">ReadSpeaker</a>
                    </div>

                    <hr/>

                    <div className="siimple-form-field">
                        <label className="siimple-label">Append text</label>
                        <div className="siimple-checkbox">
                            <input type="checkbox"
                                   id="appendText"
                                   checked={this.state.append}
                                   name="append"
                                   onChange={(e) => this.onInputChange(e)}
                            />
                            <label htmlFor="appendText"></label>
                        </div>
                    </div>

                    <div className="siimple-form-field">
                        <div className="siimple-form-field-label">Yandex ID</div>
                        <input type="text"
                               className="siimple-input siimple-input--fluid"
                               value={this.state.yandexId}
                               name="yandexId"
                               onChange={(e) => this.onInputChange(e)} />
                    </div>

                </div>
            </div>
        );
    }
}
