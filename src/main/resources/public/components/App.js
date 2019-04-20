
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
            <div>
                <h1>Translator</h1>
                <div>
                    <textarea
                        placeholder="Type in English here"
                        value={this.state.en}
                        onChange={(e) => this.handleChange(e, "en")}
                    />
                </div>
                <div>
                    <button onClick={() => this.translate("en", "ru")}>Translate en-ru</button>
                </div>
                <div>
                    <button onClick={() => this.translate("ru", "en")}>Translate ru-en</button>
                    <button onClick={() => this.loadRussianAudio()}>Load audio</button>
                </div>
                <div>
                    <audio controls ref={this.audioRef}>
                        <source src={this.state.mp3ru} type="audio/mpeg" />
                    </audio>
                </div>
                <div>
                    <textarea
                        placeholder="Напиши по русски здесь"
                        value={this.state.ru}
                        onChange={(e) => this.handleChange(e, "ru")}
                    />
                </div>
                <hr/>
                <div>
                    Yandex ID:
                    <input
                        size={50}
                        value={this.state.yandexId}
                        onChange={(e) => this.handleChange(e, "yandexId")}
                    />
                </div>
            </div>
        );
    }
}
