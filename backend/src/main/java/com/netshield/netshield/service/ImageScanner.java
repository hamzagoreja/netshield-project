package com.netshield.netshield.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.json.JSONObject;

import java.security.MessageDigest;

@Service
public class ImageScanner extends ScannerService {

    @Value("${virustotal.apikey}")
    private String apikey;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── Step 1: compute SHA-256 of file bytes ─────────────────
    private String computeSHA256(byte[] bytes) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    // ── Step 2: check if file already exists on VirusTotal ────
    private String checkExistingReport(String sha256) {
        try {
            String url = "https://www.virustotal.com/api/v3/files/" + sha256;
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-apikey", apikey);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, request, String.class);

            // File exists — parse the report directly
            JSONObject json       = new JSONObject(response.getBody());
            JSONObject attributes = json.getJSONObject("data").getJSONObject("attributes");

            // Check if last_analysis_stats exists
            if (attributes.has("last_analysis_stats")) {
                JSONObject stats  = attributes.getJSONObject("last_analysis_stats");
                int malicious     = stats.getInt("malicious");
                int harmless      = stats.getInt("harmless");
                int suspicious    = stats.getInt("suspicious");
                int undetected    = stats.getInt("undetected");
                int timeout       = stats.optInt("timeout", 0);
                int totalEngines  = malicious + harmless + suspicious + undetected + timeout;

                System.out.println("Found existing VT report. Malicious: " + malicious + "/" + totalEngines);
                return buildReport(malicious, suspicious, harmless, undetected, timeout, totalEngines, null);
            }
            return null; // stats not ready

        } catch (HttpClientErrorException.NotFound e) {
            return null; // file not on VirusTotal yet — need to upload
        } catch (Exception e) {
            System.err.println("Error checking existing report: " + e.getMessage());
            return null;
        }
    }

    // ── Step 3: upload file to VirusTotal ─────────────────────
    public String uploadImage(MultipartFile image) {
        try {
            byte[] fileBytes = image.getBytes();
            String sha256    = computeSHA256(fileBytes);
            System.out.println("File SHA-256: " + sha256);

            // Check if already analysed — skip upload if yes
            String existingReport = checkExistingReport(sha256);
            if (existingReport != null) {
                System.out.println("Using existing VirusTotal report.");
                return "EXISTING:" + sha256; // signal to getImageReport to skip polling
            }

            // Upload fresh
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.set("x-apikey", apikey);

            ByteArrayResource resource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() { return image.getOriginalFilename(); }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://www.virustotal.com/api/v3/files", request, String.class);

            JSONObject json = new JSONObject(response.getBody());
            String analysisId = json.getJSONObject("data").getString("id");
            System.out.println("Uploaded fresh. Analysis ID: " + analysisId);
            return analysisId;

        } catch (HttpClientErrorException e) {
            // 409 = AlreadySubmitted — extract hash and use existing
            System.out.println("AlreadySubmitted — fetching by hash.");
            try {
                byte[] fileBytes = image.getBytes();
                String sha256    = computeSHA256(fileBytes);
                return "EXISTING:" + sha256;
            } catch (Exception ex) {
                return "ERROR: " + ex.getMessage();
            }
        } catch (Exception e) {
            System.err.println("Upload failed: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    // ── Step 4: get report (poll or fetch existing) ────────────
    public String getImageReport(String analysisIdOrSignal, MultipartFile image) {

        if (analysisIdOrSignal == null || analysisIdOrSignal.startsWith("ERROR:")) {
            return buildErrorReport("Upload failed: " + analysisIdOrSignal);
        }

        try {
            // Already have result from hash lookup — parse it
            if (analysisIdOrSignal.startsWith("EXISTING:")) {
                String sha256 = analysisIdOrSignal.substring(9);
                String report = checkExistingReport(sha256);
                if (report != null) {
                    return appendFileInfo(report, image);
                }
                // Rare: hash found but stats missing — wait and retry
                Thread.sleep(10000);
                report = checkExistingReport(sha256);
                return report != null ? appendFileInfo(report, image) : buildErrorReport("Could not retrieve existing report.");
            }

            // Normal polling loop for fresh upload
            String url = "https://www.virustotal.com/api/v3/analyses/" + analysisIdOrSignal;
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-apikey", apikey);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            for (int attempt = 1; attempt <= 20; attempt++) {
                System.out.println("Polling attempt " + attempt + "/20");
                Thread.sleep(8000);

                ResponseEntity<String> response = restTemplate.exchange(
                        url, HttpMethod.GET, request, String.class);

                JSONObject json       = new JSONObject(response.getBody());
                JSONObject attributes = json.getJSONObject("data").getJSONObject("attributes");
                String     status     = attributes.getString("status");
                System.out.println("Status: " + status);

                if (!status.equals("completed")) continue;

                JSONObject stats  = attributes.getJSONObject("stats");
                int malicious     = stats.getInt("malicious");
                int harmless      = stats.getInt("harmless");
                int suspicious    = stats.getInt("suspicious");
                int undetected    = stats.getInt("undetected");
                int timeout       = stats.optInt("timeout", 0);
                int totalEngines  = malicious + harmless + suspicious + undetected + timeout;

                return appendFileInfo(
                        buildReport(malicious, suspicious, harmless, undetected, timeout, totalEngines, null),
                        image
                );
            }

            return buildErrorReport("Scan timed out after 20 attempts.");

        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            return buildErrorReport(e.getMessage());
        }
    }

    // ── Build clean Key: Value report ──────────────────────────
    private String buildReport(int malicious, int suspicious, int harmless,
                               int undetected, int timeout, int totalEngines,
                               MultipartFile image) {
        String verdict, riskLevel, recommendation;

        if (malicious > 0) {
            verdict        = "MALICIOUS";
            riskLevel      = "HIGH RISK";
            recommendation = "Do NOT open this file. Malware detected by " + malicious + " engine(s).";
        } else if (suspicious > 0) {
            verdict        = "SUSPICIOUS";
            riskLevel      = "MEDIUM RISK";
            recommendation = "Flagged by " + suspicious + " engine(s). Open with extreme caution.";
        } else {
            verdict        = "SAFE";
            riskLevel      = "LOW RISK";
            recommendation = "No threats detected. File appears safe.";
        }

        int securityScore = totalEngines > 0
                ? ((harmless + undetected) * 100) / totalEngines : 100;

        return  "VERDICT: "            + verdict                        + "\n" +
                "Risk Level: "         + riskLevel                      + "\n" +
                "Scan Status: "        + "COMPLETED"                    + "\n" +
                "Malicious Engines: "  + malicious                      + "\n" +
                "Suspicious Engines: " + suspicious                     + "\n" +
                "Harmless Engines: "   + harmless                       + "\n" +
                "Undetected Engines: " + undetected                     + "\n" +
                "Timeout Engines: "    + timeout                        + "\n" +
                "Total Engines: "      + totalEngines                   + "\n" +
                "Detection Ratio: "    + malicious + "/" + totalEngines + "\n" +
                "Security Score: "     + securityScore + "% Safe"       + "\n" +
                "Recommendation: "     + recommendation;
    }

    // ── Append file metadata to report ─────────────────────────
    private String appendFileInfo(String report, MultipartFile image) {
        if (image == null) return report;
        return report +
                "\nFile Name: "  + image.getOriginalFilename() +
                "\nFile Size: "  + image.getSize() + " bytes"  +
                "\nImage Type: " + image.getContentType();
    }

    private String buildErrorReport(String message) {
        return  "VERDICT: ERROR\n" +
                "Risk Level: UNKNOWN\n" +
                "Scan Status: ERROR\n" +
                "Recommendation: " + message;
    }
}