package com.sinabro.server.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Builder
public class BookMark {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bid;

    @OneToOne
    @JoinColumn(name = "place_id")
    private Places places;

    @OneToOne
    @JoinColumn(name = "label_id")
    private Label label;





}
