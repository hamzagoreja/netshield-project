package com.netshield.netshield.service;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.*;
import java.net.*;
import java.nio.Buffer;

@Service
public class ImageScanner extends ScannerService{
    @Value("${virustotal.apikey}")
    private String apikey;

    public String Scan(MultipartFile image){
        try {
            URL url=new URL("https://www.virustotal.com/api/v3/files");
            HttpURLConnection connection=(HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);
            OutputStream outputStream=connection.getOutputStream();
            outputStream.write(image.getBytes());
            outputStream.flush();
            outputStream.close();
            BufferedReader bufferedReader=new BufferedReader(new InputStreamReader(connection.getInputStream()));
            StringBuilder response=new StringBuilder();
            String line;
            while ((line=bufferedReader.readLine())!=null){
                response.append(line);
            }
            bufferedReader.close();
            JSONObject jsonObject=new JSONObject(response.toString());
            String analysisID=jsonObject.getJSONObject("data").getString("id");
            return analysisID;
        }
        catch (Exception e) {
            e.printStackTrace();
            return "Error while uploading image...";
        }
    }
}
