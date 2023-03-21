package com.sinabro.server.domain.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;
import org.springframework.data.geo.Point;

//@Getter
//@Setter
//@ToString //lombok추가해서 getter,setter, tostring 코드 삭제하고 의존성 어노테이션 추가해서 대체함.
@NoArgsConstructor
@AllArgsConstructor
@Data   //getter, setter, tostring, requiredargsconstructor, equalsandhashcode와 동일.
@Entity //자바 객체
@Builder
public class Places {

    @Id
//    @NonNull    //필수 입력하도록 함. requiredArgsConstructor가 NoArgsConstructor와 다르게 동작하도록 함. NonNull 없으면 동일하게 작동.
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long place_id;

    private String place_name;
    private String address;
    private Double latitude;
    private Double longitude;
    private String detail;

}
