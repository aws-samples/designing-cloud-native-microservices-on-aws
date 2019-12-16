package solid.humank.coffee.inventory.controllers;

import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;

@Path("/inventory")
public class InventoryResource {

    @GET
    public String sayHello() {
        return "hello";
    }

    @PUT
    public String takeOut(CoffeeBean coffeeBean) {

        return "success-200";
    }
}
