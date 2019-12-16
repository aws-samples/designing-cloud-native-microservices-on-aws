package solid.humank.coffeeshop.infra.repositories;

import solid.humank.coffeeshop.infra.repositories.coffee.CoffeeDDBMapper;
import solid.humank.coffeeshop.infra.repositories.orders.OrderDDBMapper;

import java.util.HashMap;
import java.util.Map;

public class DDBMapper {

    static final Map<String, AggregateRootMapper> map = new HashMap<>();

    static {

        map.put(solid.humank.coffeeshop.order.models.Order.class.getSimpleName(), new OrderDDBMapper());
        map.put(solid.humank.coffeeshop.coffee.models.Coffee.class.getSimpleName(), new CoffeeDDBMapper());
    }

    public static AggregateRootMapper getMapper(String name) {
        return map.get(name);
    }
}
