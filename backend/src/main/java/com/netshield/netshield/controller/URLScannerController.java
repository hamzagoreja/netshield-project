package com.netshield.netshield.controller;
import com.netshield.netshield.service.URLScanner;
import com.netshield.netshield.model.ScanResult;
import com.netshield.netshield.service.ScanResultService;
import org.springframework.http.*;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

    @Controller
    @RequestMapping("/scan")
    public class URLScannerController {
        private final URLScanner urlScanner;
        private final ScanResultService scanResultService;

        public URLScannerController(URLScanner urlScanner,ScanResultService scanResultService) {
            this.urlScanner = urlScanner;
            this.scanResultService=scanResultService;
        }

        @PostMapping("/url")
        public ResponseEntity<String> scanURL(@RequestParam("target") String target) {
            if (target==null || target.trim().isEmpty()){
                return ResponseEntity.badRequest().body("Please provide a valid URL string to scan.");
            }
            String result=urlScanner.Scan(target);
            ScanResult scanResult=new ScanResult("URL",target,result,LocalDate.now().toString());
            scanResultService.saveScanResult(scanResult);
            return ResponseEntity.ok(result);
        }
    }
