package solid.humank.coffeeshop.order.datacontracts.messages;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import lombok.Data;
import solid.humank.coffeeshop.order.datacontracts.results.OrderItemRst;

import java.util.List;

@Data
@JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY)
public class CreateOrderMsg {

    String tableNo;
    List<OrderItemRst> items;

    public CreateOrderMsg(String tableNo, List<OrderItemRst> items) {
        this.tableNo = tableNo;
        this.items = items;
    }
}
