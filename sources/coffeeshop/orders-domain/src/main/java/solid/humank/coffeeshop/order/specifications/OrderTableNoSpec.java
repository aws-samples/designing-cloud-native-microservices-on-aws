package solid.humank.coffeeshop.order.specifications;

import solid.humank.ddd.commons.baseclasses.Specification;

public class OrderTableNoSpec extends Specification<String> {
    public OrderTableNoSpec(String tableNo) {
        this.predicate = s -> tableNo.length() > 0;
        this.entity = tableNo;
    }
}
