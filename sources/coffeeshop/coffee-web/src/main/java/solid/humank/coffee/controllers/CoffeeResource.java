package solid.humank.coffee.controllers;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/coffee")
public class CoffeeResource {

    @GetMapping
    public String listCoffees() {
        return "List of available coffees";
    }
}