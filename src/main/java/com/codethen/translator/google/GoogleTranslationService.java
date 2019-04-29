package com.codethen.translator.google;

import com.codethen.translator.google.model.GoogleTranslateRequest;
import com.codethen.translator.google.model.GoogleTranslateResponse;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;
import retrofit2.http.Query;

public interface GoogleTranslationService {

    @POST("/language/translate/v2")
    Call<GoogleTranslateResponse> translate(
            @Query("key") String key,
            @Body GoogleTranslateRequest request);
}
