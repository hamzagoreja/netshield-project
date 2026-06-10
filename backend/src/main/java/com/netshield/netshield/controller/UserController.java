package com.netshield.netshield.controller;
import com.netshield.netshield.model.User;
import com.netshield.netshield.service.Userservice;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "http://localhost:3000")

public class UserController {
    private Userservice userservice;
    public UserController(Userservice userservice) {
        this.userservice = userservice;
    }
    @PostMapping("/add")
    public User addUser(@RequestBody User user){
        return userservice.saveUser(user);
    }
    @GetMapping("/all")
    public List<User> getAllUsers(){
        return userservice.getallUser();
    }
}
