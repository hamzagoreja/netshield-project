package com.netshield.netshield.controller;

import com.netshield.netshield.model.ScanResult;
import com.netshield.netshield.service.ScanResultService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/scan")
@CrossOrigin(origins = "*")
public class HistoryController {

    private final ScanResultService scanResultService;

    public HistoryController(
            ScanResultService scanResultService
    ) {
        this.scanResultService = scanResultService;
    }

    @GetMapping("/history")
    public List<ScanResult> getHistory() {

        return scanResultService.getAllScanResults();
    }
}