package solid.humank.coffeeshop.order.repositories;

import solid.humank.coffeeshop.infra.repositories.DDBRepositoryBase;
import solid.humank.coffeeshop.infra.repositories.orders.OrderRepoSpec;
import solid.humank.coffeeshop.order.interfaces.IOrderRepository;
import solid.humank.coffeeshop.order.models.Order;
import solid.humank.coffeeshop.order.models.OrderId;
import solid.humank.ddd.commons.baseclasses.Specification;

import javax.enterprise.context.Dependent;
import java.time.OffsetDateTime;
import java.util.List;

@Dependent
public class OrderRepository implements IOrderRepository {

    DDBRepositoryBase<Order, OrderId> repository = new DDBRepositoryBase<>();

    public OrderRepository() {
    }

//    @Inject
//    public IRepository<Order, OrderId> repository;

    public Order save(Order order) {

        this.repository.create(order);
        return order;
    }

    @Override
    public List<Order> get(Specification<Order> specification, int pageNo, int pageSize) {
        return null;
    }

    public OrderId generateOrderId() {
        //return new OrderId(this.repository.count(new OrderRepoSpec()) + 1, OffsetDateTime.now());
        OffsetDateTime now = OffsetDateTime.now();
        return new OrderId(now.toEpochSecond(), now);
    }

    @Override
    public Order getBy(OrderId id) {

        return this.repository.get(id);
    }
}
