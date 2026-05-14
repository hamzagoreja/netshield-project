package com.netshield.netshield.controller;
import com.netshield.netshield.service.ImageScanner;
import org.springframework.web.bind.annotation.*;

@RestController
public class ImageScannerController {
    private ImageScanner imageScanner;
    public ImageScannerController(ImageScanner imageScanner){
        this.imageScanner=imageScanner;
    }
    @GetMapping("/scan/image")
    public String scanImage(@RequestParam String target){
        return imageScanner.Scan(target);
    }
}
