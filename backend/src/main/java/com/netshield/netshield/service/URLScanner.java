package com.netshield.netshield.service;
import org.springframework.beans.factory.annotation.*;
import org.json.JSONObject;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.*;
import org.springframework.web.client.RestTemplate;

@Service
public class URLScanner extends ScannerService{
    @Value("${virustotal.apikey}")
    private String apikey;
    private final RestTemplate restTemplate=new RestTemplate();

    @Override
    public String Scan(String target){

        try{
            String url="https://www.virustotal.com/api/v3/urls";

            HttpHeaders headers=new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("x-apikey",apikey);

            MultiValueMap<String,String> body=new LinkedMultiValueMap<>();
            body.add("url",target);

            HttpEntity<MultiValueMap<String,String>> request=new HttpEntity<>(body,headers);
            ResponseEntity<String> response=restTemplate.postForEntity(url,request,String.class);

            JSONObject jsonObject=new JSONObject(response.getBody());
            String analysisID=jsonObject.getJSONObject("data").getString("id");

            return getURLReport(analysisID,target);
        }
        catch (Exception e) {
            return "Error submitting URL: " + e.getMessage();
        }
    }

    public String getURLReport(String analysisID,String target) {
        try {
            String url = "https://www.virustotal.com/api/v3/analyses/" + analysisID;

            HttpHeaders headers = new HttpHeaders();
            headers.set("x-apikey", apikey);
            HttpEntity<Void> request = new HttpEntity<>(headers);
            for (int attempt = 1; attempt <= 5; attempt++) {
                System.out.println("Checking URL scan status... attempt " + attempt + "/5");
                Thread.sleep(3000);

                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

                JSONObject jsonObject = new JSONObject(response.getBody());
                JSONObject attributes = jsonObject.getJSONObject("data").getJSONObject("attributes");
                String status = attributes.getString("status");
                System.out.println("URL Scan Status: " + status);

                if (status.equals("completed")) {
                    JSONObject stats = attributes.getJSONObject("stats");

                    int malicious = stats.getInt("malicious");
                    int harmless = stats.getInt("harmless");
                    int suspicious = stats.getInt("suspicious");
                    int undetected = stats.getInt("undetected");
                    int timeout = stats.getInt("timeout");

                    int totalEngines = malicious + harmless + suspicious + undetected + timeout;

                    String riskLevel;
                    String recommendation;

                    if(malicious > 0){
                        riskLevel = "HIGH RISK";
                        recommendation = "This URL is dangerous.";
                    }
                    else if(suspicious > 0){
                        riskLevel = "MEDIUM RISK";
                        recommendation = "Open this URL carefully.";
                    }
                    else{
                        riskLevel = "LOW RISK";
                        recommendation = "URL appears safe.";
                    }
                    int securityScore = 0;

                    if(totalEngines > 0){
                        securityScore = ((harmless + undetected) * 100) / totalEngines;
                    }
                    return
                            "VERDICT: SAFE\n" +
                                    "Risk Level: " + riskLevel + "\n" +
                                    "Malicious Engines: " + malicious + "\n" +
                                    "Suspicious Engines: " + suspicious + "\n" +
                                    "Harmless Engines: " + harmless + "\n" +
                                    "Undetected Engines: " + undetected + "\n" +
                                    "Total Engines: " + totalEngines + "\n" +
                                    "Detection Ratio: " + malicious + "/" + totalEngines + "\n" +
                                    "Security Score: " + securityScore + "% Safe\n" +
                                    "Recommendation: " + recommendation;
                }
            }
        return "URL scan is taking too long. Please try again.";
    }
        catch (Exception e) {
            e.printStackTrace();
            return "Error getting report!" + e.getMessage();
        }
    }
}
