package solid.humank.coffeeshop.order.domainservices;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import solid.humank.coffeeshop.order.datacontracts.results.OrderItemRst;
import solid.humank.coffeeshop.order.models.OrderItem;
import solid.humank.ddd.commons.interfaces.ITranslator;

import javax.enterprise.context.Dependent;
import java.util.ArrayList;
import java.util.List;

@Dependent
public class OrderItemsTranslator implements ITranslator<List<OrderItem>, List<OrderItemRst>> {

    Logger logger = LoggerFactory.getLogger(OrderItemsTranslator.class);

    @Override
    public List<OrderItem> translate(List<OrderItemRst> transRequest) {
        List<OrderItem> orderItemList = new ArrayList<>();
        for (OrderItemRst orderItemRst : transRequest) {

            logger.info("orderItemRst.getProductId(): " + orderItemRst.getProductId());
            logger.info("orderItemRst.getQty(): " + orderItemRst.getQty());
            logger.info("orderItemRst.getPrice() " + orderItemRst.getPrice());
            orderItemList.add(
                    new OrderItem(orderItemRst.getProductId(),
                            orderItemRst.getQty(),
                            orderItemRst.getPrice())
            );
        }
        return orderItemList;
    }
}
