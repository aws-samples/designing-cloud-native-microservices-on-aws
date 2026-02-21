package solid.humank.coffeeshop.order.applications;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import solid.humank.coffeeshop.infra.serializations.DomainEventPublisher;
import solid.humank.coffeeshop.order.commands.CreateOrder;
import solid.humank.coffeeshop.order.datacontracts.messages.CreateOrderMsg;
import solid.humank.coffeeshop.order.datacontracts.results.OrderItemRst;
import solid.humank.coffeeshop.order.datacontracts.results.OrderRst;
import solid.humank.coffeeshop.order.exceptions.AggregateException;
import solid.humank.coffeeshop.order.interfaces.IOrderRepository;
import solid.humank.coffeeshop.order.models.Order;
import solid.humank.coffeeshop.order.models.OrderId;
import solid.humank.coffeeshop.order.models.OrderItem;
import solid.humank.coffeeshop.order.models.OrderStatus;
import solid.humank.ddd.commons.interfaces.ITranslator;
import solid.humank.ddd.commons.utilities.DomainModelMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.io.Serializable;
import java.util.List;


@Service
public class CreateOrderSvc implements Serializable {

    //TODO verify implementation result

    @Autowired
    public IOrderRepository repository;
    @Autowired
    public ITranslator<List<OrderItem>, List<OrderItemRst>> translator;
    @Autowired
    DomainEventPublisher domainEventPublisher;
    Logger logger = LoggerFactory.getLogger(CreateOrderSvc.class);

    /**
     * The barista accepts the order and retrieves ingredients from the fridge
     * based on the products listed in the order.
     * The barista periodically updates the order status.
     * <p>
     * The barista and order BCs have a Partner relationship.
     * Orders do not directly affect inventory.
     * However, when the barista retrieves from the fridge and stock is insufficient,
     * inventory is synchronously fetched/deducted.
     * <p>
     * Producer --> Event <-- Consumer
     * OrderDomain |OrderCreated | Coffee to accept the order
     * Coffee      |OrderAccepted|
     */

    public CreateOrderSvc() {
    }

    public OrderRst establishOrder(CreateOrderMsg request) throws AggregateException {

        OrderId id = this.repository.generateOrderId();
        List<OrderItem> items = translator.translate(request.getItems());

        CreateOrder cmd = new CreateOrder(id, request.getTableNo(), OrderStatus.INITIAL, items);
        Order createdOrder = Order.create(cmd);

        logger.info(new DomainModelMapper().writeToJsonString(createdOrder));

        this.repository.save(createdOrder);

        domainEventPublisher.publish(createdOrder.getDomainEvents());

        return new OrderRst(createdOrder);
    }
}
