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

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.Serializable;
import java.util.List;


@ApplicationScoped
public class CreateOrderSvc implements Serializable {

    //TODO 確認實作結果

    @Inject
    public IOrderRepository repository;
    @Inject
    public ITranslator<List<OrderItem>, List<OrderItemRst>> translator;
    @Inject
    DomainEventPublisher domainEventPublisher;
    Logger logger = LoggerFactory.getLogger(CreateOrderSvc.class);

    /**
     * 咖啡師 會接受訂單，並且開始依照訂單上的產品去冰箱取得原物料
     * 咖啡師會定期更新訂單狀態
     * <p>
     * 所以咖啡師和訂單的BC是Partner關係
     * 訂單不會直接影響到庫存
     * 這邊你寫在哪?
     * 但是咖啡師取冰箱的時候，如果已經不足，會去同步取/扣庫存
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
