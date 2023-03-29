package com.sinabro.server.domain.entity;

import javax.persistence.*;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Builder
public class Label {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long lid;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String label_name;

    private String label_color;
}
