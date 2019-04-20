package com.codethen.translator.api;

import com.codethen.translator.api.model.TranslateRequest;
import com.codethen.translator.api.model.TranslateResponse;
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

    public TranslatorApi() {

        yandex = new Retrofit.Builder()
                .baseUrl("https://translate.yandex.net/api/v1/")
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(YandexService.class);
    }

    @PostMapping("translate")
    public TranslateResponse findGames(@RequestBody TranslateRequest translateReq) {

        String lang = translateReq.from + "-" + translateReq.to;

        final Call<YandexResponse> yandexCall = yandex.translate(
                translateReq.text,
                4,
                translateReq.id,
                "tr-text",
                lang,
                "auto");

        try {
            final Response<YandexResponse> response = yandexCall.execute();

            final YandexResponse yandexResp = response.body();

            return new TranslateResponse(yandexResp.text.get(0));

        } catch (IOException e) {

            return new TranslateResponse("Error translating: " + e.toString());
        }
    }
}
