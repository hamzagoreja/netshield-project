package com.netshield.netshield.controller;
import com.netshield.netshield.service.FileScanner;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.*;
import java.io.*;
import java.net.*;

@RestController
public class FileScannerController {

    private FileScanner fileScanner;

    public FileScannerController(FileScanner fileScanner){
        this.fileScanner=fileScanner;
    }
    @PostMapping("/scan/file")
    public String scanFile(@RequestParam("file")MultipartFile file){
        return fileScanner.Scan(file);
    }
}
