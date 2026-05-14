package com.netshield.netshield.service;
import com.netshield.netshield.model.ScanResult;
import com.netshield.netshield.repository.ScanResultRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ScanResultService{

    private ScanResultRepository  scanResultRepository;
    public ScanResultService(ScanResultRepository scanResultRepository){
        this.scanResultRepository=scanResultRepository;
    }

    public ScanResult saveScanResult(ScanResult scanResult){
        return scanResultRepository.save(scanResult);

    }

    public List <ScanResult> getAllScanResults() {
        return scanResultRepository.findAll();
    }
}

