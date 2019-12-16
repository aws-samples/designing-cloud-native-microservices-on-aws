package solid.humank.coffeeshop.infra.repositories.coffee;

import solid.humank.ddd.commons.baseclasses.Specification;

public class CoffeeRepoSpec extends Specification {
    public CoffeeRepoSpec() {
        super();
        this.targetTable = "Coffee";
    }
}
