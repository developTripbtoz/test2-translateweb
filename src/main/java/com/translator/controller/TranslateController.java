package com.translator.controller;

import com.translator.service.TranslateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class TranslateController {

    private final TranslateService translateService;

    public TranslateController(TranslateService translateService) {
        this.translateService = translateService;
    }

    @PostMapping("/translate")
    public ResponseEntity<Map<String, String>> translate(@RequestBody Map<String, String> body) {
        String text = body.getOrDefault("text", "");
        String sourceLang = body.getOrDefault("sourceLang", "auto");

        if (text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "텍스트가 비어있습니다."));
        }

        try {
            String translated = translateService.translate(text, sourceLang, "ko");
            return ResponseEntity.ok(Map.of(
                "original", text,
                "translated", translated
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "번역 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
}
