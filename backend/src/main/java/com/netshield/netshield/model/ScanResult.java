package com.netshield.netshield.model;

import jakarta.persistence.*;

@Entity
public class ScanResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private long ID;
    private String scanType;
    private String target;
    private String result;
    private String scanDate;
    public ScanResult()
    {

    }

    public ScanResult(String scanType,String target,String result ,String scanDate){
        this.scanType=scanType;
        this.target=target;
        this.result=result;
        this.scanDate=scanDate;
    }

    public long getID() {
        return ID;
    }

    public String getScanType() {
        return scanType;
    }

    public void setScanType(String scanType) {
        this.scanType = scanType;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public String getScanDate() {
        return scanDate;
    }

    public void setScanDate(String scanDate) {
        this.scanDate = scanDate;
    }
}
