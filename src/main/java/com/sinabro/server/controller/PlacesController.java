package com.sinabro.server.controller;

import com.sinabro.server.model.places.Places;
import com.sinabro.server.model.places.PlacesDAO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Api(tags = {"장소 API"})
public class PlacesController {

    @Autowired
    private PlacesDAO placesDAO;
    @GetMapping("/api/places")
    @ApiOperation(value = "등록된 모든 장소 정보 조회", notes = "사용자에 의해 등록된 모든 장소의 정보를 조회합니다.", responseContainer = "List")
    public List<Places> getAllPlaces() {
        return placesDAO.getAllPlaces();
    }

    @PostMapping("/api/places/save")
    @ApiOperation(value = "장소 등록", notes = "마커 위치에 대한 장소 정보를 등록합니다.", responseContainer = "List")
    public Places save(@RequestBody Places place) {
        return placesDAO.save(place);
    }
}
