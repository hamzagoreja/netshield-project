package com.netshield.netshield.service;

import org.springframework.stereotype.Service;

@Service
public class ImageScanner extends ScannerService{
    @Override
    public String Scan(String target){
        if (target.contains("malware")){
            return "Suspicious Image...";
        }
        return "Safe Image...";
    }
}
