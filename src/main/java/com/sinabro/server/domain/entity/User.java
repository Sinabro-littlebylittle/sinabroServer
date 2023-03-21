package com.sinabro.server.domain.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NonNull
    private String uid;

    @NonNull
    private String uname;

    @NonNull
    private String email;

    @ColumnDefault("0")
    private Double point_score;


}
