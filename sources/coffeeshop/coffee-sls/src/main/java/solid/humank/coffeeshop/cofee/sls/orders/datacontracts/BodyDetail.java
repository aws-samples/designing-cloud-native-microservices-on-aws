package solid.humank.coffeeshop.cofee.sls.orders.datacontracts;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import solid.humank.coffeeshop.infra.serializations.EntityId;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY)
@EqualsAndHashCode(callSuper = false)
@JsonIgnoreProperties(ignoreUnknown = true)
public class BodyDetail {
    String eventId;
    OffsetDateTime occurredDate;
    EntityId entityId;
    String tableNo;
    List<OrderItem> orderItems;
    OffsetDateTime createdDate;
}
