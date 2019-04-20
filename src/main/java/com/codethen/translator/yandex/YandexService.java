package com.codethen.translator.yandex;

import com.codethen.translator.yandex.model.YandexResponse;
import retrofit2.Call;
import retrofit2.http.*;

public interface YandexService {

  @POST("tr.json/translate")
  @FormUrlEncoded
  Call<YandexResponse> translate(
          @Field("text") String text,
          @Field("options") int options,
          @Query("id") String id,
          @Query("srv") String srv,
          @Query("lang") String lang,
          @Query("reason") String reason);
}