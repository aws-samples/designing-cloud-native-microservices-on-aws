package solid.humank.coffeeshop.coffee.interfaces;

import solid.humank.coffeeshop.coffee.models.Coffee;
import solid.humank.coffeeshop.coffee.models.CoffeeId;
import solid.humank.ddd.commons.baseclasses.Specification;

import java.util.List;

public interface ICoffeeRepository {

    List<Coffee> get(Specification<Coffee> specification, int pageNo, int pageSize);

    CoffeeId generateCoffeeId();

    Coffee getBy(CoffeeId id);

    Coffee save(Coffee coffee);
}
