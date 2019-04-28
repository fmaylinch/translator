
class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            other: "",
            ru: "",
            fileInfos: [],
            loading: null,
            append: true,
            ttsEngine: localStorage.getItem("ttsEngine") || "readSpeaker",
            yandexApiKey: localStorage.getItem("yandexApiKey") || "",
            googleApiKey: localStorage.getItem("googleApiKey") || "",
            awsApiKey: localStorage.getItem("awsApiKey") || ""
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

            }).catch(error => {
                this.changeText(stateTo, error);
            }).finally(() => {
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

        const ttsReq = this.buildTextToSpeechRequest();

        this.setState({loading: "audio"});

        axios.post("/api/translator/text-to-speech", ttsReq)
            .then(response => {

                const ttsResp = response.data;
                console.log("TTS response", ttsResp);

                const fileInfo = {
                    ttsEngine: this.state.ttsEngine,
                    text: ttsReq.text,
                    mp3: ttsResp.mp3
                };

                this.setState(
                    state => ({fileInfos: [...state.fileInfos, fileInfo], loading: null}),
                    () => this.audioRef.current.load()
                );

            }).catch(error => {
                this.changeText("other", error); // TODO: Where to put this message?
            }).finally(() => {
                this.setState({loading: null});
            });
    }

    buildTextToSpeechRequest() {

        let ttsReqs = {

            readSpeaker: {
                service: "readSpeaker",
                text: this.state.ru,
                voice: "Russian - female"
            },

            google: {
                service: "google",
                text: this.state.ru,
                lang: "ru",
                voice: "ru-Ru-Wavenet-C",
                apiKey: this.state.googleApiKey
            },

            awsPolly: {
                service: "awsPolly",
                text: this.state.ru,
                voice: "Tatyana",
                apiKey: this.state.awsApiKey
            }
        };

        return ttsReqs[this.state.ttsEngine];
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
                            {this.displaySpinnerWhenLoading("audio")}
                        </div>
                        {this.state.fileInfos.map(fileInfo => (
                            <div>
                                <div>
                                    {fileInfo.mp3.startsWith("data:") ?
                                        <span>{fileInfo.ttsEngine} - {fileInfo.text.substring(0, 20)}</span>
                                        :
                                        <a href={fileInfo.mp3}>{fileInfo.ttsEngine} - {fileInfo.text.substring(0, 20)}</a>
                                    }
                                </div>
                                <div>
                                    <audio controls ref={this.audioRef}>
                                        <source src={fileInfo.mp3} type="audio/mpeg" />
                                    </audio>
                                </div>
                            </div>

                        ))}
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
                        <label className="siimple-label">TTS engine: </label>
                        <select className="siimple-select"
                                value={this.state.ttsEngine}
                                name="ttsEngine"
                                data-stored="true"
                                onChange={(e) => this.onInputChange(e)}>
                            <option value="readSpeaker">ReadSpeaker</option>
                            <option value="google">Google</option>
                            <option value="awsPolly">AWS Polly</option>
                        </select>
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
                    <div className="siimple-form-field">
                        <div className="siimple-form-field-label">AWS API Key</div>
                        <input type="text"
                               className="siimple-input siimple-input--fluid"
                               value={this.state.awsApiKey}
                               name="awsApiKey"
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
