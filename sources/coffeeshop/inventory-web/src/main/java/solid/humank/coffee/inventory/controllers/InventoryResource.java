package solid.humank.coffee.inventory.controllers;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/inventory")
public class InventoryResource {

    @GetMapping
    public String sayHello() {
        return "hello";
    }

    @PutMapping
    public String takeOut(@RequestBody CoffeeBean coffeeBean) {

        return "success-200";
    }
}
