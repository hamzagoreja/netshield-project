package com.netshield.netshield.controller;
import com.netshield.netshield.service.URLScanner;
import com.netshield.netshield.model.ScanResult;
import com.netshield.netshield.service.ScanResultService;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

    @RestController
    public class URLScannerController {
        private URLScanner urlScanner;
        private ScanResultService scanResultService;

        public URLScannerController(URLScanner urlScanner,ScanResultService scanResultService) {
            this.urlScanner = urlScanner;
            this.scanResultService=scanResultService;
        }

        @GetMapping("/scan/url")
        public String scanURL(@RequestParam String target) {

            String result=urlScanner.Scan(target);
            ScanResult scanResult=new ScanResult("URL",target,result,LocalDate.now().toString());
            scanResultService.saveScanResult(scanResult);
            return result;
        }
    }
