package solid.humank.coffeeshop.order;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/")
public class AppResource {

    @GetMapping
    public String healthCheck() {
        return "{\"status\":\"healthy\"}";
    }
}
