package com.codethen.translator.yandex;

import com.codethen.translator.yandex.model.YandexResponse;
import retrofit2.Call;
import retrofit2.http.*;

public interface YandexService {

  @GET("tr.json/translate")
  Call<YandexResponse> translate(
          @Query("key") String key,
          @Query("text") String text,
          @Query("lang") String lang);
}