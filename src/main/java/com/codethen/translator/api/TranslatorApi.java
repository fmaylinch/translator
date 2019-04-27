package com.codethen.translator.api;

import com.amazonaws.ClientConfiguration;
import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.polly.AmazonPolly;
import com.amazonaws.services.polly.AmazonPollyClientBuilder;
import com.amazonaws.services.polly.model.OutputFormat;
import com.amazonaws.services.polly.model.SynthesizeSpeechRequest;
import com.amazonaws.services.polly.model.SynthesizeSpeechResult;
import com.codethen.translator.api.model.TTSRequest;
import com.codethen.translator.api.model.TTSResponse;
import com.codethen.translator.api.model.TranslateRequest;
import com.codethen.translator.api.model.TranslateResponse;
import com.codethen.translator.google.GoogleService;
import com.codethen.translator.google.model.SynthesizeRequest;
import com.codethen.translator.google.model.SynthesizeResponse;
import com.codethen.translator.readspeaker.ReadSpeakerService;
import com.codethen.translator.readspeaker.model.ReadSpeakerResponse;
import com.codethen.translator.storage.FileStorageService;
import com.codethen.translator.yandex.YandexService;
import com.codethen.translator.yandex.model.YandexResponse;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import retrofit2.Call;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

@RestController
@RequestMapping(path = "/api/translator")
public class TranslatorApi {

    private final YandexService yandex;
    private final ReadSpeakerService readspeaker;
    private final GoogleService google;

    private AmazonPolly lastPolly;
    private AWSCredentials lastAwsCredentials;

    private final FileStorageService fileStorageService;

    @Autowired
    public TranslatorApi(FileStorageService fileStorageService) {

        this.fileStorageService = fileStorageService;

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
            } else if ("awsPolly".equals(ttsReq.service)) {
                return awsPollySynthesize(ttsReq);
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
        request.voice.languageCode = ttsReq.lang;
        request.voice.name = ttsReq.voice;

        final Call<SynthesizeResponse> call = google.synthesize(
                ttsReq.apiKey,
                request
        );

        final SynthesizeResponse response = call.execute().body();

        final String audioContentBase64 = response.audioContent;

        // return getTtsResponseForBase64(audioContentBase64);

        final byte[] bytes = Base64.decodeBase64(audioContentBase64);
        final File file = fileStorageService.storeBytesAsFile(bytes);
        return getTtsResponseForFile(file);
    }

    private TTSResponse awsPollySynthesize(TTSRequest ttsReq) {

        final AmazonPolly polly = getAmazonPolly(ttsReq);

        final SynthesizeSpeechRequest synthReq = new SynthesizeSpeechRequest()
                .withText(ttsReq.text)
                .withVoiceId(ttsReq.voice)
                .withOutputFormat(OutputFormat.Mp3);

        final SynthesizeSpeechResult synthRes = polly.synthesizeSpeech(synthReq);

        final InputStream audioStream = synthRes.getAudioStream();

        //final byte[] bytes = IOUtils.toByteArray(audioStream);
        //final String audioBase64 = Base64.encodeBase64String(bytes);
        //return getTtsResponseForBase64(audioBase64);

        final File file = fileStorageService.storeInputStreamAsFile(audioStream);
        return getTtsResponseForFile(file);
    }

    private TTSResponse getTtsResponseForFile(File file) {
        return new TTSResponse("/api/files/" + file.getName());
    }

    private TTSResponse getTtsResponseForBase64(String audioContentBase64) {
        return new TTSResponse("data:audio/mp3;base64," + audioContentBase64);
    }

    private AmazonPolly getAmazonPolly(TTSRequest ttsReq) {

        final String[] keyAndSecret = ttsReq.apiKey.split(" ");

        final AWSCredentials awsCredentials = new BasicAWSCredentials(keyAndSecret[0], keyAndSecret[1]);

        if (awsCredentials.getAWSAccessKeyId().length() != 20 || awsCredentials.getAWSSecretKey().length() != 40) {
            throw new IllegalArgumentException("Api key probably wrong: " + ttsReq.apiKey);
        }

        if (lastAwsCredentials != null
                && lastAwsCredentials.getAWSAccessKeyId().equals(awsCredentials.getAWSAccessKeyId())
                && lastAwsCredentials.getAWSSecretKey().equals(awsCredentials.getAWSSecretKey())) {

            return lastPolly;
        }

        lastPolly = AmazonPollyClientBuilder.standard()
                .withCredentials(new AWSStaticCredentialsProvider(awsCredentials))
                .withClientConfiguration(new ClientConfiguration())
                .withRegion(Regions.EU_WEST_1)
                .build();

        lastAwsCredentials = awsCredentials;

        return lastPolly;
    }
}
