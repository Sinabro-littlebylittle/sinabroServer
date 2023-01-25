package com.sinabro.server.controller;

import com.sinabro.server.model.places.Places;
import com.sinabro.server.model.places.PlacesDAO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class PlacesController {
    @Autowired
    private PlacesDAO placesDAO;
    @GetMapping("/api/places")
    public List<Places> getAllPlaces() {
        return placesDAO.getAllPlaces();
    }

    @PostMapping("/api/places/save")
    public Places save(@RequestBody Places place) {
        return placesDAO.save(place);
    }
}
