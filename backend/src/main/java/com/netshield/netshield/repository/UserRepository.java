package com.netshield.netshield.repository;
import com.netshield.netshield.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User,Long> {

}
