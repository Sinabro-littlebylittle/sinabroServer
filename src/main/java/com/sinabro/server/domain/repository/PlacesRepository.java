package com.sinabro.server.domain.repository;

import com.sinabro.server.domain.entity.Places;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlacesRepository extends CrudRepository<Places, Integer> {

}
