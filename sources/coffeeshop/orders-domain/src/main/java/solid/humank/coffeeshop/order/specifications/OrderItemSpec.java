package solid.humank.coffeeshop.order.specifications;

import solid.humank.coffeeshop.order.models.OrderItem;
import solid.humank.ddd.commons.baseclasses.Specification;

import java.util.List;
import java.util.Objects;

public class OrderItemSpec extends Specification<List<OrderItem>> {
    public OrderItemSpec(List<OrderItem> orderItems) {
        this.entity = orderItems;
        this.predicate = o -> orderItems.stream().anyMatch(Objects::nonNull);
    }
}
