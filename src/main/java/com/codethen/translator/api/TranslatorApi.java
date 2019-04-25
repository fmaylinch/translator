package com.codethen.translator.api;

import com.codethen.translator.api.model.TTSRequest;
import com.codethen.translator.api.model.TTSResponse;
import com.codethen.translator.api.model.TranslateRequest;
import com.codethen.translator.api.model.TranslateResponse;
import com.codethen.translator.google.GoogleService;
import com.codethen.translator.google.model.SynthesizeRequest;
import com.codethen.translator.google.model.SynthesizeResponse;
import com.codethen.translator.readspeaker.ReadSpeakerService;
import com.codethen.translator.readspeaker.model.ReadSpeakerResponse;
import com.codethen.translator.yandex.YandexService;
import com.codethen.translator.yandex.model.YandexResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import retrofit2.Call;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

import java.io.IOException;

@RestController
@RequestMapping(path = "/api/translator")
public class TranslatorApi {

    private final YandexService yandex;
    private final ReadSpeakerService readspeaker;
    private final GoogleService google;

    public TranslatorApi() {

        yandex = new Retrofit.Builder()
                .baseUrl("https://translate.yandex.net/api/v1.5/")
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(YandexService.class);

        readspeaker = new Retrofit.Builder()
                .baseUrl("https://demo.readspeaker.com/")
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(ReadSpeakerService.class);

        google = new Retrofit.Builder()
                .baseUrl("https://texttospeech.googleapis.com/v1/")
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(GoogleService.class);
    }

    @PostMapping("translate")
    public TranslateResponse translate(@RequestBody TranslateRequest translateReq) {

        final String lang = translateReq.from + "-" + translateReq.to;

        final Call<YandexResponse> yandexCall = yandex.translate(translateReq.apiKey, translateReq.text, lang);

        try {
            final Response<YandexResponse> response = yandexCall.execute();

            final YandexResponse yandexResp = response.body();

            if (response.code() == 200) {
                return new TranslateResponse(yandexResp.text.get(0));
            } else {
                return new TranslateResponse("Error translating: " + response.errorBody().string());
            }

        } catch (IOException e) {

            return new TranslateResponse("IO Error translating: " + e.toString());
        }
    }

    @PostMapping("text-to-speech")
    public TTSResponse textToSpeech(@RequestBody TTSRequest ttsReq) {

        try {

            if ("readSpeaker".equals(ttsReq.service)) {
                return readSpeaker(ttsReq);
            } else if ("google".equals(ttsReq.service)) {
                return googleSynthesize(ttsReq);
            } else {
                throw new RuntimeException("Unknown service: " + ttsReq.service);
            }

        } catch (IOException e) {

            throw new RuntimeException("error converting audio", e);
        }
    }

    private TTSResponse readSpeaker(@RequestBody TTSRequest ttsReq) throws IOException {

        final Call<ReadSpeakerResponse> call = readspeaker.tts(
                "tts-software",
                ttsReq.voice,
                ttsReq.text,
                "mp3"
        );

        final ReadSpeakerResponse response = call.execute().body();

        return new TTSResponse(response.links.mp3);
    }

    private TTSResponse googleSynthesize(TTSRequest ttsReq) throws IOException {

        final SynthesizeRequest request = new SynthesizeRequest();

        request.audioConfig.audioEncoding = "MP3";
        request.input.text = ttsReq.text;
        request.voice.languageCode = ttsReq.voice;

        final Call<SynthesizeResponse> call = google.synthesize(
                ttsReq.apiKey,
                request
        );

        final SynthesizeResponse response = call.execute().body();

        return new TTSResponse("data:audio/mp3;base64,"
                + response.audioContent);
    }
}
