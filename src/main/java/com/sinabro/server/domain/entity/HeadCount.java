package com.sinabro.server.domain.entity;

import javax.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Builder
public class HeadCount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long hid;

    @OneToOne
    @JoinColumn(name = "place_id")
    private Places places;

    private Integer count;

    private LocalDateTime time_stamp;

    private String writer;  //등록하는 유저의 id

}
