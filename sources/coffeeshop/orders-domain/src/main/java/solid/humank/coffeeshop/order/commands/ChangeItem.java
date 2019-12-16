package solid.humank.coffeeshop.order.commands;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import solid.humank.coffeeshop.order.models.OrderItem;

import java.util.List;

public class ChangeItem {

    @Getter
    @Setter(AccessLevel.PRIVATE)
    List<OrderItem> items;

    public ChangeItem(List<OrderItem> items) {
        this.items = items;
    }
}
