package cucumber;

import io.cucumber.java8.En;
import solid.humank.coffeeshop.order.commands.CreateOrder;
import solid.humank.coffeeshop.order.models.Order;
import solid.humank.coffeeshop.order.models.OrderId;
import solid.humank.coffeeshop.order.models.OrderItem;
import solid.humank.coffeeshop.order.models.OrderStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class OrderAmericanoSteps implements En {

    CreateOrder cmd;
    Order createdOrder;

    public OrderAmericanoSteps() {

        Given("customer wants to order coffee with the following detail", (io.cucumber.datatable.DataTable dataTable) -> {
            List<Map<String, String>> testData = dataTable.asMaps(String.class, String.class);
            Map<String, String> sample = testData.get(0);

            String productId = sample.get("coffee");
            int qty = Integer.valueOf(sample.get("quantity"));
            BigDecimal price = new BigDecimal(sample.get("price"));

            List<OrderItem> items = new ArrayList<>();
            items.add(new OrderItem(productId, qty, price));
            cmd = new CreateOrder(new OrderId(1, OffsetDateTime.now()), "0", OrderStatus.INITIAL, items);

        });

        When("the order is confirmed", () -> createdOrder = Order.create(cmd));

        Then("the total fee should be {int}l", (Integer int1) -> {
            assertEquals(createdOrder.totalFee().longValue(), int1.longValue());
        });
    }
}
