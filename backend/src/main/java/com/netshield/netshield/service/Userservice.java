package com.netshield.netshield.service;
import  com.netshield.netshield.repository.UserRepository;
import com.netshield.netshield.model.User;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class Userservice {

    private UserRepository userRepository;

    public Userservice(UserRepository userRepository){
        this.userRepository=userRepository;
    }
    public User saveUser(User user)
    {
        return userRepository.save(user);
    }
    public List<User> getallUser()
    {
        return userRepository.findAll();
    }
}
