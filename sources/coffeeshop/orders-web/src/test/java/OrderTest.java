import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;
import solid.humank.coffeeshop.order.models.requests.AddOrderReq;
import solid.humank.coffeeshop.order.models.requestsmodels.OrderItemRM;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static io.restassured.RestAssured.given;

@QuarkusTest
public class OrderTest {

    @Test
    public void addOrderTest() throws JsonProcessingException {
        System.out.println(System.getProperty("software.amazon.awssdk.http.service.impl"));
        AddOrderReq req = new AddOrderReq();
        List<OrderItemRM> list = new ArrayList<>();
        list.add(new OrderItemRM("123", 2, new BigDecimal(200)));
        req.setItems(list);
        ObjectMapper mapper = new ObjectMapper();

        String body = mapper.writeValueAsString(req);
        given()
                .body(req)
                .header("Content-Type", "application/json")
                .when().post("/order")
                .then()
                .assertThat()
                .statusCode(201);
    }

    @Test
    public void tesPrint() {
        String s = "{\\\"detail-type\\\": [ \\\"customevent\\\" ],\\\"source\\\": [\\\"solid.humank.coffeeshop.order\\\"]}";
        System.out.println(s);
    }
}
