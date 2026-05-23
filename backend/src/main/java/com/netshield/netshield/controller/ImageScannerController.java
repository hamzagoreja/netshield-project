package com.netshield.netshield.controller;
import com.netshield.netshield.model.ScanResult;
import com.netshield.netshield.service.ImageScanner;
import com.netshield.netshield.service.ScanResultService;
import com.netshield.netshield.service.URLScanner;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@RequestMapping("/scan")
public class ImageScannerController {
    private final ScanResultService scanResultService;
    private final ImageScanner imageScanner;

    public ImageScannerController(URLScanner urlScanner, ScanResultService scanResultService, ImageScanner imageScanner) {
        this.scanResultService = scanResultService;
        this.imageScanner = imageScanner;
    }
    @PostMapping("/image")
    public ResponseEntity<String> scanImage(@RequestParam("image") MultipartFile image) {

        if (image.isEmpty()) {
            return ResponseEntity.badRequest().body("Please provide a file.");
        }

        String analysisID = imageScanner.uploadImage(image);
        if (analysisID.startsWith("ERROR: ")){
            return ResponseEntity.internalServerError().body(analysisID);
        }
        String result = imageScanner.getImageReport(analysisID,image);
        ScanResult scanResult=new ScanResult("IMAGE", image.getOriginalFilename(), result, LocalDate.now().toString());
        scanResultService.saveScanResult(scanResult);
        return ResponseEntity.ok(result);
    }
}
