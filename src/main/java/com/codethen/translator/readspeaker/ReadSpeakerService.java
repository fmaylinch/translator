package com.codethen.translator.readspeaker;

import com.codethen.translator.readspeaker.model.ReadSpeakerResponse;
import retrofit2.Call;
import retrofit2.http.Field;
import retrofit2.http.FormUrlEncoded;
import retrofit2.http.POST;

public interface ReadSpeakerService {

    @POST("proxy.php")
    @FormUrlEncoded
    Call<ReadSpeakerResponse> tts(
            @Field("l") String l,
            @Field("v") String voice,
            @Field("t") String text,
            @Field("f") String format);
}
