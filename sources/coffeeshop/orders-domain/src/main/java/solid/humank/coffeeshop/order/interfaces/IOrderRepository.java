package solid.humank.coffeeshop.order.interfaces;

import solid.humank.coffeeshop.order.models.Order;
import solid.humank.coffeeshop.order.models.OrderId;
import solid.humank.ddd.commons.baseclasses.Specification;

import java.util.List;

public interface IOrderRepository {

    List<Order> get(Specification<Order> specification, int pageNo, int pageSize);

    OrderId generateOrderId();

    Order getBy(OrderId id);

    Order save(Order order);
}

