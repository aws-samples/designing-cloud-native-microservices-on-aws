package solid.humank.coffeeshop.order.commands;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import solid.humank.coffeeshop.order.models.OrderId;
import solid.humank.coffeeshop.order.models.OrderItem;
import solid.humank.coffeeshop.order.models.OrderStatus;

import java.util.List;

public class CreateOrder {

    @Getter
    @Setter(AccessLevel.PRIVATE)
    private OrderId id;

    @Getter
    @Setter(AccessLevel.PRIVATE)
    private String tableNo;

    @Getter
    @Setter(AccessLevel.PRIVATE)
    private OrderStatus status;

    @Getter
    @Setter(AccessLevel.PRIVATE)
    private List<OrderItem> items;

    public CreateOrder(OrderId id, String tableNo, OrderStatus status, List<OrderItem> items) {
        this.id = id;
        this.tableNo = tableNo;
        this.status = status;
        this.items = items;
    }
}
