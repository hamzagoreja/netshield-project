package com.netshield.netshield.service;

import org.springframework.beans.factory.annotation.*;
import org.springframework.core.io.*;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.*;
import org.springframework.web.client.*;
import org.springframework.web.multipart.*;
import org.json.JSONObject;

@Service
public class ImageScanner extends ScannerService{
    @Value("${virustotal.apikey}")
    private String apikey;

    private final RestTemplate restTemplate=new RestTemplate();

    public String uploadImage(MultipartFile image){
        try {
            String url="https://www.virustotal.com/api/v3/files";

            HttpHeaders headers=new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("x-apikey",apikey);

            ByteArrayResource imageResource=new ByteArrayResource(image.getBytes()) {
                @Override
                public String getFilename() {
                    return image.getOriginalFilename();
                }
            };
            MultiValueMap<String,Object> body=new LinkedMultiValueMap<>();
            body.add("file",imageResource);

            HttpEntity<MultiValueMap<String,Object>> request=new HttpEntity<>(body,headers);
            ResponseEntity<String> response=restTemplate.postForEntity(url,request,String.class);

                JSONObject jsonObject=new JSONObject(response.getBody());
                String analysisID=jsonObject.getJSONObject("data").getString("id");
                System.out.println("Image uploaded! Analysis ID: " + analysisID);
                return analysisID;
        }
        catch (Exception e) {
            System.err.println("Image upload fail: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    public String getImageReport(String analysisID, MultipartFile image){
        if (analysisID==null || analysisID.startsWith("ERROR:")){
            return "Image upload failed. Cannot get results.";
        }
        try {
            String url="https://www.virustotal.com/api/v3/analyses/" + analysisID;

            HttpHeaders headers=new HttpHeaders();
            headers.set("x-apikey",apikey);
            HttpEntity<Void> request=new HttpEntity<>(headers);

            for (int attempt=1 ; attempt<=20;attempt++){
                System.out.println("Checking image results... attempt " + attempt + "/20");
                Thread.sleep(8000);

                ResponseEntity<String> response=restTemplate.exchange(url,HttpMethod.GET,request,String.class);
                JSONObject jsonObject=new JSONObject(response.getBody());
                JSONObject attributes=jsonObject.getJSONObject("data").getJSONObject("attributes");
                String status=attributes.getString("status");
                System.out.println("Status: " + status);

                if (status.equals("completed")){
                    JSONObject stats=attributes.getJSONObject("stats");
                    int malicious  = stats.getInt("malicious");
                    int harmless   = stats.getInt("harmless");
                    int suspicious = stats.getInt("suspicious");
                    int undetected = stats.getInt("undetected");
                    int timeout    = stats.getInt("timeout");
                    String riskLevel;
                    String recommendation;
                    int totalEngines = malicious + harmless + suspicious + undetected + timeout;

                    if(malicious > 0){
                        riskLevel = "HIGH RISK";
                        recommendation = "Do NOT open this image. Malware detected.";
                    }
                    else if(suspicious > 0){
                        riskLevel = "MEDIUM RISK";
                        recommendation = "Open carefully. Some engines flagged this image.";
                    }
                    else{
                        riskLevel = "LOW RISK";
                        recommendation = "image appears safe to use.";
                    }
                    int securityScore = 0;

                    if(totalEngines > 0){
                        securityScore = ((harmless + undetected)*100) / totalEngines;
                    }

                    String imageType =image.getContentType();
                    long fileSize = image.getSize();

                    return
                            "<pre>" +
                            "\n========== NETSHIELD SECURITY REPORT ==========\n\n" +

                            "image Information:\n" +
                            "--------------------------------\n" +
                            "image Name        : " + imageType + "\n" +
                            "image Size        : " + fileSize + " bytes\n"+
                            "Image Type      : " + imageType + "\n" +
                            "Scan Status      : COMPLETED\n" +
                            "Risk Level       : " + riskLevel + "\n\n" +

                            "Detection Summary:\n" +
                            "--------------------------------\n" +
                            "Malicious Engines : " + malicious + "\n" +
                            "Suspicious Engines: " + suspicious + "\n" +
                            "Harmless Engines  : " + harmless + "\n" +
                            "Undetected Engines: " + undetected + "\n" +
                            "Timeout Engines   : " + timeout + "\n" +
                            "Total Engines     : " + totalEngines + "\n\n" +

                            "Threat Analysis:\n" +
                            "--------------------------------\n" +
                            "Detection Ratio   : " + malicious + "/" + totalEngines + "\n" +

                            "Security Score    : " + securityScore +"% Safe\n\n" +

                            "Recommendation:\n" +
                            "--------------------------------\n" +
                            recommendation + "\n\n" +
                            "\n================================================"
                            + "</pre>";
                    }
                }
            return "Image scan is taking too long. Please try again.";
        }
        catch (Exception e) {
            System.err.println("Error getting image results: " + e.getMessage());
            return "Error: " + e.getMessage();
        }

    }
}
