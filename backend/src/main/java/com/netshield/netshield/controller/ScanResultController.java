package com.netshield.netshield.controller;
import com.netshield.netshield.model.ScanResult;
import com.netshield.netshield.repository.ScanResultRepository;
import com.netshield.netshield.service.ScanResultService;
import org.springframework.web.bind.annotation.*;
import  java.util.List;

    @RestController
    @RequestMapping("/scan")
    @CrossOrigin(origins = "http://localhost:3000")

    public class ScanResultController{
        private ScanResultService scanResultService;
        public ScanResultController(ScanResultService scanResultService){
            this.scanResultService=scanResultService;
        }
        @PostMapping("/add")
        public ScanResult saveScanResult(@RequestBody ScanResult scanResult){
            return scanResultService.saveScanResult(scanResult);
        }
        @GetMapping("/all")
        public List<ScanResult> getAllScanResults(){
            return scanResultService.getAllScanResults();
        }
    }
