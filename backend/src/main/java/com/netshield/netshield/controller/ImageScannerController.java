package com.netshield.netshield.controller;

import com.netshield.netshield.model.ScanResult;
import com.netshield.netshield.service.ImageScanner;
import com.netshield.netshield.service.ScanResultService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/scan")
@CrossOrigin(origins = "*")
public class ImageScannerController {

    private final ImageScanner imageScanner;
    private final ScanResultService scanResultService;

    // Inject ImageScanner directly (not the abstract ScannerService)
    public ImageScannerController(ImageScanner imageScanner,
                                  ScanResultService scanResultService) {
        this.imageScanner      = imageScanner;
        this.scanResultService = scanResultService;
    }

    @PostMapping("/image")
    public ResponseEntity<String> scanImage(
            @RequestParam("image") MultipartFile image) {

        if (image == null || image.isEmpty()) {
            return ResponseEntity.badRequest().body("No image file provided.");
        }

        // Step 1 — upload image to VirusTotal, get analysis ID
        String analysisId = imageScanner.uploadImage(image);

        // Step 2 — poll VirusTotal until scan is complete, get full report
        String report = imageScanner.getImageReport(analysisId, image);

        // Step 3 — save result to MySQL
        // Detect verdict from the report text so we can store it
        String verdict = "SAFE";
        String upper   = report.toUpperCase();
        if (upper.contains("HIGH RISK") || upper.contains("MALICIOUS")) {
            verdict = "MALICIOUS";
        } else if (upper.contains("MEDIUM RISK") || upper.contains("SUSPICIOUS")) {
            verdict = "SUSPICIOUS";
        }

        ScanResult result = new ScanResult();
        result.setScanType("IMAGE");
        result.setTarget(image.getOriginalFilename());
        result.setResult(report);
        scanResultService.saveScanResult(result);

        // Step 4 — return full report to frontend
        return ResponseEntity.ok(report);
    }
}