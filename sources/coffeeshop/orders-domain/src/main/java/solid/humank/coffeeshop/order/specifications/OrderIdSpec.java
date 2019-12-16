package solid.humank.coffeeshop.order.specifications;

import solid.humank.coffeeshop.order.models.OrderId;
import solid.humank.ddd.commons.baseclasses.Specification;

import java.util.regex.Pattern;

public class OrderIdSpec extends Specification<OrderId> {

    public OrderIdSpec(OrderId orderId) {
        String pattern = "ord-\\d{8}-\\d{1,}";
        this.entity = orderId;
        this.predicate = oid -> Pattern.matches(pattern, oid.toString());
    }
}
