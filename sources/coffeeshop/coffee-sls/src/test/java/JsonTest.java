import org.junit.jupiter.api.Test;
import solid.humank.coffeeshop.cofee.sls.orders.datacontracts.OrderCreated;
import solid.humank.ddd.commons.utilities.DomainModelMapper;

import static org.junit.jupiter.api.Assertions.assertNotNull;

public class JsonTest {

    @Test
    public void test() {
        String data = "{\"eventId\":\"b17534fe-3b93-4d3b-b1c2-cf9ca040755b\",\"occurredDate\":1574142357.804512000,\"entityId\":{\"abbr\":\"ord\",\"seqNo\":15,\"occurredDate\":1574142357.799072000},\"tableNo\":\"0\",\"orderItems\":[{\"productId\":\"123\",\"qty\":2,\"price\":200}],\"createdDate\":1574142357.802369000}";

        System.out.println(data);
        DomainModelMapper mapper = new DomainModelMapper();
        OrderCreated created = mapper.readValue(data, OrderCreated.class);
        assertNotNull(created);
    }


}
