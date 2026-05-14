package com.netshield.netshield.service;

import org.springframework.stereotype.Service;

@Service
public class FileScanner extends ScannerService{
    @Override
    public String Scan(String target){
        if (target.endsWith(".exe")){
            return "File is not safe to open...";
        }
        return "File is safe to open ";
    }
}
