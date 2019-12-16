package solid.humank.coffeeshop.order.domainevents;

import lombok.Getter;
import lombok.Setter;
import solid.humank.coffeeshop.order.models.OrderItem;
import solid.humank.ddd.commons.baseclasses.DomainEvent;
import solid.humank.ddd.commons.baseclasses.EntityId;

import java.time.OffsetDateTime;
import java.util.List;

public class OrderItemsChanged extends DomainEvent {
    @Getter
    @Setter
    private List<OrderItem> changedItems;
    @Getter
    @Setter
    private OffsetDateTime modifiedDate;

    public OrderItemsChanged(EntityId id, List<OrderItem> items, OffsetDateTime modifiedDate) {

        this.setEntityId(id);
        this.setChangedItems(items);
        this.setModifiedDate(modifiedDate);
    }

}
