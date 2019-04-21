package com.codethen.translator.api;

import com.codethen.translator.api.model.TTSRequest;
import com.codethen.translator.api.model.TTSResponse;
import com.codethen.translator.api.model.TranslateRequest;
import com.codethen.translator.api.model.TranslateResponse;
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

    private static final String yandexApiKey = "trnsl.1.1.20190421T122207Z.d1622c95e8057226.ce69156f4828aad7dd2a354c97a553e4ba1eb7e4";

    private final YandexService yandex;
    private final ReadSpeakerService readspeaker;

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

        final Call<ReadSpeakerResponse> yandexCall = readspeaker.tts(
                "tts-software",
                ttsReq.voice,
                ttsReq.text,
                "mp3"
        );

        try {
            final Response<ReadSpeakerResponse> response = yandexCall.execute();

            final ReadSpeakerResponse readSpeakerResp = response.body();

            return new TTSResponse(readSpeakerResp.links.mp3);

        } catch (IOException e) {

            throw new RuntimeException("error converting audio", e);
        }
    }
}
