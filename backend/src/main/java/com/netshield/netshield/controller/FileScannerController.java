package com.netshield.netshield.controller;

import com.netshield.netshield.model.ScanResult;
import com.netshield.netshield.service.FileScanner;
import com.netshield.netshield.service.ScanResultService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@RequestMapping("/scan")
public class FileScannerController {
    private final ScanResultService scanResultService;
    private final FileScanner fileScanner;

    public FileScannerController(FileScanner fileScanner, ScanResultService scanResultService) {
        this.fileScanner = fileScanner;
        this.scanResultService = scanResultService;
    }

    @PostMapping("/file")
    public ResponseEntity<String> scanFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a file to upload.");
        }
        String analysisID = fileScanner.uploadFile(file);

        if (analysisID.startsWith("ERROR:")) {
            return ResponseEntity.internalServerError().body(analysisID);
        }

        String result = fileScanner.getFileReport(analysisID,file);
        ScanResult scanResult=new ScanResult("FILE", file.getOriginalFilename(), result, LocalDate.now().toString());
        scanResultService.saveScanResult(scanResult);
        return ResponseEntity.ok(result);
    }
}