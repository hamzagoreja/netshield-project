package com.netshield.netshield.controller;
import com.netshield.netshield.service.FileScanner;
import org.springframework.web.bind.annotation.*;

@RestController
public class FileScannerController {
    private FileScanner fileScanner;
    public FileScannerController(FileScanner fileScanner){
        this.fileScanner=fileScanner;
    }
    @GetMapping("/scan/file")
    public String scanFile(@RequestParam String target){
        return fileScanner.Scan(target);
    }
}
