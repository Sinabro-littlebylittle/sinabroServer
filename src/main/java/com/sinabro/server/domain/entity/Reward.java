package com.sinabro.server.domain.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Builder
public class Reward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bid;

    private double point;
}
