package solid.humank.coffeeshop.order.models.requests;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.AllArgsConstructor;
import lombok.Data;
import solid.humank.coffeeshop.order.models.requestsmodels.OrderItemRM;

import java.util.ArrayList;
import java.util.List;

@Data
@RegisterForReflection
@AllArgsConstructor
public class AddOrderReq {

    List<OrderItemRM> items;

    public AddOrderReq() {
        items = new ArrayList<>();
    }
}
