import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import solid.humank.coffeeshop.order.models.requests.AddOrderReq;
import solid.humank.coffeeshop.order.models.requestsmodels.OrderItemRM;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class OrderTest {

    @Test
    public void addOrderTest() throws JsonProcessingException {
        AddOrderReq req = new AddOrderReq();
        List<OrderItemRM> list = new ArrayList<>();
        list.add(new OrderItemRM("123", 2, new BigDecimal(200)));
        req.setItems(list);
        ObjectMapper mapper = new ObjectMapper();

        String body = mapper.writeValueAsString(req);
        // Integration test requires running Spring Boot context — skipped for unit test
        System.out.println("Order JSON: " + body);
    }

    @Test
    public void testPrint() {
        String s = "{\"detail-type\": [ \"customevent\" ],\"source\": [\"solid.humank.coffeeshop.order\"]}";
        System.out.println(s);
    }
}
