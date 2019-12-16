package solid.humank.coffeeshop.order.policies;

import solid.humank.coffeeshop.order.OrderErrorCode;
import solid.humank.coffeeshop.order.exceptions.AggregateException;
import solid.humank.coffeeshop.order.exceptions.OrderIdIsNullException;
import solid.humank.coffeeshop.order.exceptions.OrderItemEmptyException;
import solid.humank.coffeeshop.order.exceptions.TableNoEmptyException;
import solid.humank.coffeeshop.order.models.Order;
import solid.humank.coffeeshop.order.models.OrderId;
import solid.humank.coffeeshop.order.specifications.OrderIdSpec;
import solid.humank.coffeeshop.order.specifications.OrderItemSpec;
import solid.humank.coffeeshop.order.specifications.OrderTableNoSpec;

import java.util.ArrayList;
import java.util.List;

public class OrderPolicy {
    public static void Verify(Order order) throws AggregateException {

        List<Exception> exceptions = new ArrayList<>();
        if (new OrderIdSpec((OrderId) order.getId()).isSatisfy() == false)
            exceptions.add(new OrderIdIsNullException(Order.class.getName(), OrderErrorCode.ORDER_ID_IS_NULL, "Order Id can not be null"));

        if (new OrderTableNoSpec(order.getTableNo()).isSatisfy() == false)
            exceptions.add(new TableNoEmptyException(Order.class.getName(), OrderErrorCode.TABLE_NO_IS_EMPTY, "Table no can not be empty"));

        if (new OrderItemSpec(order.getOrderItems()).isSatisfy() == false)
            exceptions.add(new OrderItemEmptyException(Order.class.getName(), OrderErrorCode.ORDER_ITEMS_ARE_EMPTY_OR_NULL, "OrderItem can not be empty or null"));

        if (exceptions.size() > 0)
            throw new AggregateException(exceptions);
    }
}
