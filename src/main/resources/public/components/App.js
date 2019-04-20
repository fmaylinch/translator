
class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            en: "",
            ru: "",
            yandexId: "26e324a6.5cbb1afa.3ee63c8f-0-0"
        }
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

                const stateUpdate = {};
                stateUpdate[to] = translation.text;
                this.setState(stateUpdate);
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
                    <button onClick={() => this.translate("ru", "en")}>Translate ru-en</button>
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
