package solid.humank.coffeeshop.cofee.sls.orders.datacontracts;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import solid.humank.coffeeshop.infra.serializations.EntityId;


@AllArgsConstructor
@Data
@EqualsAndHashCode(callSuper = true)
public class OrderId extends EntityId {


}
