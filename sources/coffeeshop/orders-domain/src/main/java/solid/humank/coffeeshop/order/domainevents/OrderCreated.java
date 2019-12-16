package solid.humank.coffeeshop.order.domainevents;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import solid.humank.coffeeshop.order.models.OrderItem;
import solid.humank.ddd.commons.baseclasses.DomainEvent;
import solid.humank.ddd.commons.baseclasses.EntityId;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY)
public class OrderCreated<OrderId extends EntityId> extends DomainEvent<OrderId> {

    String tableNo;
    List<OrderItem> orderItems;
    OffsetDateTime createdDate;

    public OrderCreated(OrderId orderId, String tableNo, List<OrderItem> orderItems, OffsetDateTime createdDate) {
        this.entityId = orderId;
        this.tableNo = tableNo;
        this.orderItems = orderItems;
        this.createdDate = createdDate;

    }
}
