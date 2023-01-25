package com.sinabro.server;

import com.sinabro.server.model.places.Places;
import com.sinabro.server.model.places.PlacesDAO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.geo.Point;

@SpringBootTest
class ServerApplicationTests {

	@Autowired
	private PlacesDAO placesDAO;

	@Test
	void addPlaceTest() {
		Places place = new Places();
		place.setPlace_name("충북대학교 소프트웨어학부");
		place.setAddress("충북 청주시 서원구 충대로 1, 충북대학교 전자정보대학 소프트웨어학부 S4-1동(전자정보 3관)");
		place.setLatitude(36.6256189988713);
		place.setLongitude(127.45440041773291);

		placesDAO.save(place);
	}
}
