package solid.humank.coffeeshop.order.datacontracts.messages;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import lombok.Data;

@Data
@JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY)
public class OrderReadModel {

    private String orderString;

    public OrderReadModel(String orderString) {
        this.orderString = orderString;
    }

    public String getOrderString() {
        return orderString;
    }

    public void setOrderString(String orderString) {
        this.orderString = orderString;
    }
}
