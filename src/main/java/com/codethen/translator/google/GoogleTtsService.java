package com.codethen.translator.google;

import com.codethen.translator.google.model.SynthesizeRequest;
import com.codethen.translator.google.model.SynthesizeResponse;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;
import retrofit2.http.Query;

public interface GoogleTtsService {

    // About the dot prefix:
    // https://github.com/square/retrofit/issues/2730#issuecomment-380428575

    @POST("./text:synthesize")
    Call<SynthesizeResponse> synthesize(
            @Query("key") String key,
            @Body SynthesizeRequest request);
}
