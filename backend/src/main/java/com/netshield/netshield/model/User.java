package com.netshield.netshield.model;
import jakarta.persistence.*;
import org.hibernate.annotations.AnyDiscriminatorImplicitValues;


@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long  id;

    private  String name;
    private String email;
    private String password;

    public User(){

    }
    public User(String name,String email,String password){
        this.email=email;
        this.name=name;
        this.password=password;
    }

    public long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
