package com.netshield.netshield.service;
import org.springframework.beans.factory.annotation.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

import org.springframework.stereotype.Service;

@Service
public class URLScanner extends ScannerService{
    @Value("${virustotal.apikey}")
    private String apikey;
    @Override
    public String Scan(String target){

        try{
            String apiURL="https://www.virustotal.com/api/v3/urls";
            URL url=new URL(apiURL);

            HttpURLConnection connection=(HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("x-apikey",apikey);
            connection.setDoOutput(true);

            String data="url="+target;
            connection.getOutputStream().write(data.getBytes());
            BufferedReader reader=new BufferedReader(new InputStreamReader(connection.getInputStream()));
            String line;
            StringBuilder response=new StringBuilder();

            while ((line= reader.readLine())!=null){
                response.append(line);
            }
            reader.close();
            JSONObject jsonObject=new JSONObject(response.toString());
            String analysisID=jsonObject.getJSONObject("data").getString("id");
            return analysisID;
        }
        catch (Exception e){
            return "Error: "+e.getMessage();
        }
    }
}
