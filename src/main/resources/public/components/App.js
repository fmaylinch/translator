
class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            other: "",
            ru: "",
            mp3ru: null,
            loading: null,
            append: true,
            useGoogleTTS: true,
            yandexApiKey: localStorage.getItem("yandexApiKey") || "",
            googleApiKey: localStorage.getItem("googleApiKey") || ""
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
            apiKey: this.state.yandexApiKey
        };

        this.setState({loading: stateTo});

        axios.post("/api/translator/translate", translateReq)
            .then(response => {

                const translation = response.data;
                console.log("Translation response", translation);

                this.changeText(stateTo, translation.text);
                this.setState({loading: null});
            });
    }

    /** Changes stateField, by either replacing or appending the text */
    changeText(stateField, text) {

        let finalText = this.buildText(this.state[stateField], text);
        this.setState({[stateField]: finalText});
    }

    buildText(currentText, newText) {

        if (!this.state.append) return newText;

        const separation = currentText.length > 0 ? " " : "";
        return currentText + separation + newText;
    }

    /** Loads current russian text as audio using TTS service */
    loadRussianAudio() {

        let ttsReqReadSpeaker = {
            service: "readSpeaker",
            text: this.state.ru,
            voice: "Russian - female"
        };

        let ttsReqGoogle = {
            service: "google",
            text: this.state.ru,
            voice: "ru",
            apiKey: this.state.googleApiKey
        };

        const ttsReq = this.state.useGoogleTTS ? ttsReqGoogle : ttsReqReadSpeaker;

        this.setState({loading: "mp3ru"});

        axios.post("/api/translator/text-to-speech", ttsReq)
            .then(response => {

                const ttsResp = response.data;
                console.log("TTS response", ttsResp);

                this.setState({mp3ru: ttsResp.mp3, loading: null}, () => {
                    this.audioRef.current.load();
                });
            });
    }

    /** Includes disabled class if this.state.loading */
    classForBtn(otherClasses, stateField) {

        const disabled = this.state.loading || this.state[stateField].trim().length === 0;
        return "siimple-btn " + otherClasses + (disabled ? " siimple-btn--disabled" : "");
    }

    copyToClipboard(ref) {

        const el = ref.current;

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

        if (target.dataset.stored) {
            console.log("Storing in local storage", target.name, target.value)
            localStorage.setItem(target.name, target.value);
        }
    }

    clearValue(name) {

        this.setState({[name]: ""});
    }

    render() {

        return (
            <div className="siimple-content siimple-content--extra-large">
                <div className="siimple-form">

                    <div className="siimple-form-field">
                        <div className="spinner-container">
                            <textarea
                                className="siimple-textarea siimple-textarea--fluid"
                                rows="4"
                                placeholder="English / Spanish"
                                value={this.state.other}
                                name="other"
                                onChange={(e) => this.onInputChange(e)}
                            />
                            {this.displaySpinnerWhenLoading("other")}
                        </div>
                        <div className="button-bar-bottom">
                            <div className={this.classForBtn("siimple-btn--primary", "other")}
                                 onClick={() => this.translate("en", "ru")}>en &gt; ru</div>
                            <div className={this.classForBtn("siimple-btn--success", "other")}
                                 onClick={() => this.translate("es", "ru")}>es &gt; ru</div>
                            <div className="siimple-btn siimple-btn--error"
                                 onClick={() => this.clearValue("other")}>Clear</div>
                        </div>
                    </div>

                    <div className="siimple-form-field">
                        <div className="button-bar-top">
                            <div className={this.classForBtn("siimple-btn--primary", "ru")}
                                 onClick={() => this.translate("ru", "en")}>ru &gt; en</div>
                            <div className={this.classForBtn("siimple-btn--success", "ru")}
                                 onClick={() => this.translate("ru", "es")}>ru &gt; es</div>
                            <div className="siimple-btn siimple-btn--error"
                                 onClick={() => this.clearValue("ru")}>Clear</div>
                            <div className="siimple-btn siimple-btn--warning"
                                 onClick={() => this.copyToClipboard(this.russianRef)}>Copy</div>
                        </div>
                        <div className="spinner-container">
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
                            {this.displaySpinnerWhenLoading("ru")}
                        </div>
                    </div>

                    <div className="siimple-form-field">
                        <div className="spinner-container button-bar-top">
                            <div className={this.classForBtn("siimple-btn--primary", "ru")}
                                 onClick={() => this.loadRussianAudio()}>Load audio</div>
                            <a href={this.state.mp3ru}>
                                {this.state.mp3ru && this.state.loading !== "mp3ru" && this.state.mp3ru.startsWith("https") ?
                                    this.state.mp3ru.replace("https://media.readspeaker.com/cache/", "") : ""}
                            </a>
                            {this.displaySpinnerWhenLoading("mp3ru")}
                        </div>
                        <div>
                            <audio controls ref={this.audioRef}>
                                <source src={this.state.mp3ru} type="audio/mpeg" />
                            </audio>
                        </div>
                    </div>

                    <div className="siimple-form-title">Translator</div>
                    <div className="siimple-form-detail">
                        Powered by <span/>
                        <a target="_blank" href="http://translate.yandex.com/">Yandex</a>, <span/>
                        <a href="https://cloud.google.com/text-to-speech/">Google</a>, <span/>
                        <a target="_blank" href="https://www.readspeaker.com/">ReadSpeaker</a>
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
                            <label htmlFor="appendText"/>
                        </div>
                    </div>

                    <div className="siimple-form-field">
                        <label className="siimple-label">Use Google TTS (disable for ReadSpeaker)</label>
                        <div className="siimple-checkbox">
                            <input type="checkbox"
                                   id="useGoogleTTS"
                                   checked={this.state.useGoogleTTS}
                                   name="useGoogleTTS"
                                   onChange={(e) => this.onInputChange(e)}
                            />
                            <label htmlFor="useGoogleTTS"/>
                        </div>
                    </div>

                    <div className="siimple-form-field">
                        <div className="siimple-form-field-label">Yandex API Key</div>
                        <input type="text"
                               className="siimple-input siimple-input--fluid"
                               value={this.state.yandexApiKey}
                               name="yandexApiKey"
                               data-stored="true"
                               onChange={(e) => this.onInputChange(e)} />
                    </div>
                    <div className="siimple-form-field">
                        <div className="siimple-form-field-label">Google API Key</div>
                        <input type="text"
                               className="siimple-input siimple-input--fluid"
                               value={this.state.googleApiKey}
                               name="googleApiKey"
                               data-stored="true"
                               onChange={(e) => this.onInputChange(e)} />
                    </div>

                </div>
            </div>
        );
    }

    displaySpinnerWhenLoading(name) {
        return this.state.loading === name ?
            <div className="siimple-spinner siimple-spinner--primary" />
            : null;
    }
}
