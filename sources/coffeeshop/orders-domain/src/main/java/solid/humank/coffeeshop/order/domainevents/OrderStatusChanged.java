package solid.humank.coffeeshop.order.domainevents;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import solid.humank.coffeeshop.order.models.OrderStatus;
import solid.humank.ddd.commons.baseclasses.DomainEvent;
import solid.humank.ddd.commons.baseclasses.EntityId;

import java.time.OffsetDateTime;

public class OrderStatusChanged extends DomainEvent<EntityId> {

    @Getter
    @Setter(AccessLevel.PRIVATE)
    private OffsetDateTime modifiedDate;
    @Getter
    @Setter(AccessLevel.PRIVATE)
    private OrderStatus lastStatus;
    @Getter
    @Setter(AccessLevel.PRIVATE)
    private OrderStatus curStatus;


    public OrderStatusChanged(EntityId id, OrderStatus lastStatus, OrderStatus curStatus, OffsetDateTime modifiedDate) {

        this.entityId = id;
        this.lastStatus = lastStatus;
        this.curStatus = curStatus;
        this.modifiedDate = modifiedDate;
    }
}
