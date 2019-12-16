package solid.humank.coffeeshop.infra.repositories.orders;

import solid.humank.ddd.commons.baseclasses.Specification;

public class OrderRepoSpec extends Specification {

    public OrderRepoSpec() {
        super();
        this.targetTable = "Order";
    }
}
