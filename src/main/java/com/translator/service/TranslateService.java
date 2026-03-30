package com.translator.service;

import com.google.gson.JsonArray;
import com.google.gson.JsonParser;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

@Service
public class TranslateService {

    private final OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();

    public String translate(String text, String sourceLang, String targetLang) throws Exception {
        String encoded = URLEncoder.encode(text, StandardCharsets.UTF_8.toString());
        String url = String.format(
            "https://translate.googleapis.com/translate_a/single?client=gtx&sl=%s&tl=%s&dt=t&q=%s",
            sourceLang, targetLang, encoded
        );

        Request request = new Request.Builder().url(url).get().build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful() || response.body() == null) {
                throw new RuntimeException("Google Translate API 호출 실패: " + response.code());
            }

            String json = response.body().string();
            JsonArray root = JsonParser.parseString(json).getAsJsonArray();
            JsonArray sentences = root.get(0).getAsJsonArray();

            StringBuilder result = new StringBuilder();
            for (int i = 0; i < sentences.size(); i++) {
                JsonArray sentence = sentences.get(i).getAsJsonArray();
                result.append(sentence.get(0).getAsString());
            }
            return result.toString();
        }
    }
}
