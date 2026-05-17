package com.netshield.netshield.controller;
import com.netshield.netshield.service.ImageScanner;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class ImageScannerController {
    private ImageScanner imageScanner;

    public ImageScannerController(ImageScanner imageScanner){
        this.imageScanner=imageScanner;
    }
    @PostMapping("/scan/image")
    public String Scan(@RequestParam("image")MultipartFile image){
        return imageScanner.Scan(image);
    }
}
