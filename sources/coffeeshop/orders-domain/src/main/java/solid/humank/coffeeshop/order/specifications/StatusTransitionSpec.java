package solid.humank.coffeeshop.order.specifications;

import solid.humank.coffeeshop.order.models.OrderStatus;
import solid.humank.ddd.commons.baseclasses.Specification;

public class StatusTransitionSpec extends Specification {
    public StatusTransitionSpec(OrderStatus curStatus, OrderStatus previousStatus, OrderStatus targetStatus) {
        super.entity = curStatus;
        super.predicate = o ->
                curStatus == previousStatus && (curStatus.getValue() - targetStatus.getValue() == 1);

    }
}
