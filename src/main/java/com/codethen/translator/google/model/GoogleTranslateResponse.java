package com.codethen.translator.google.model;

import java.util.List;

public class GoogleTranslateResponse {

    public Data data;

    public static class Data {
        public List<Translation> translations;
    }

    public static class Translation {
        public String translatedText;
    }
}
