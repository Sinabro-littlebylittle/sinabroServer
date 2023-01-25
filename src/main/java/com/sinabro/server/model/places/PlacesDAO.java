package com.sinabro.server.model.places;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.util.Streamable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PlacesDAO {
    @Autowired
    private PlacesRepository repository;

    public Places save(Places places) {
        return repository.save(places);
    }

    public void delete(Places places) {
        repository.delete(places);
    }

    public List<Places> getAllPlaces() {
        List<Places> places = new ArrayList<>();
        Streamable.of(repository.findAll()).forEach(places::add);
        return places;
    }
}
