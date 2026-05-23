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
public class FileScanner {
    // This reads your API key from application.properties
    @Value("${virustotal.apikey}")
    private String apiKey;
    // RestTemplate is the tool we use to make HTTP requests
    private final RestTemplate restTemplate = new RestTemplate();

    public String uploadFile(MultipartFile file) {
        try {
            String url = "https://www.virustotal.com/api/v3/files";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("x-apikey", apiKey);
            // Wrap the file so Spring can send it
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            // Build the request body
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);
            // Send the file to VirusTotal
            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            // VirusTotal responds with an Analysis ID
            // Example response: { "data": { "id": "abc123", "type": "analysis" } }
            JSONObject json = new JSONObject(response.getBody());

            String analysisId = json.getJSONObject("data").getString("id");
            System.out.println("File uploaded! Analysis ID: " + analysisId);
            return analysisId;
        }
        catch (Exception e) {
            System.err.println("Upload failed: " + e.getMessage());
            return "ERROR:" + e.getMessage();
        }
    }
    // ───────────────────────────────────────────
    // STEP 2: Keep asking VirusTotal for results
    // until it says "completed"
    // ───────────────────────────────────────────
    public String getFileReport(String analysisId,MultipartFile file) {
        // If upload failed, don't even try
        if (analysisId == null || analysisId.startsWith("ERROR:")) {
            return "Upload failed. Cannot get results.";
        }
        try {
            String url = "https://www.virustotal.com/api/v3/analyses/" + analysisId;
            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-apikey", apiKey);
            HttpEntity<Void> request = new HttpEntity<>(headers);
            // Poll up to 20 times, every 8 seconds = max ~160 seconds wait
            for (int attempt = 1; attempt <= 20; attempt++) {
                System.out.println("Checking results... attempt " + attempt + "/20");
                // Wait 8 seconds before each check
                Thread.sleep(8000);
                // Ask VirusTotal: "is the scan done?"
                ResponseEntity<String> response = restTemplate.exchange(
                        url, HttpMethod.GET, request, String.class
                );
                // Parse the response
                JSONObject json       = new JSONObject(response.getBody());
                JSONObject attributes = json.getJSONObject("data").getJSONObject("attributes");
                String status         = attributes.getString("status");
                System.out.println("Status: " + status);
                // If done, return the results
                if (status.equals("completed")) {
                    JSONObject stats = attributes.getJSONObject("stats");

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
                        recommendation = "Do NOT open this file. Malware detected.";
                    }
                    else if(suspicious > 0){
                        riskLevel = "MEDIUM RISK";
                        recommendation = "Open carefully. Some engines flagged this file.";
                    }
                    else{
                        riskLevel = "LOW RISK";
                        recommendation = "File appears safe to use.";
                    }

                    int securityScore = 0;
                    if(totalEngines > 0){
                        securityScore = ((harmless + undetected) * 100) / totalEngines;
                    }

                    String fileName = file.getOriginalFilename();
                    long fileSize = file.getSize();

                    return "<pre>" +
                            "\n========== NETSHIELD SECURITY REPORT ==========\n\n" +

                                    "File Information:\n" +
                                    "--------------------------------\n" +
                                    "File Name        : " + fileName + "\n" +
                                    "File Size        : " + fileSize + " bytes\n" +
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

                                    "Security Score    : "+ securityScore+"% Safe\n\n" +

                                    "Recommendation:\n" +
                                    "--------------------------------\n" +
                                    recommendation + "\n\n" +
                                    "\n================================================"
                + "</pre>";
                }
                // Otherwise loop again and wait...
            }
            return "Scan is taking too long. Please try again.";
        }
        catch (Exception e) {
            System.err.println("Error getting results: " + e.getMessage());
            return "Error: " + e.getMessage();
        }
    }
}