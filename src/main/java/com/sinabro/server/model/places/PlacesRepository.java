package com.sinabro.server.model.places;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlacesRepository extends CrudRepository<Places, Integer> {

}
