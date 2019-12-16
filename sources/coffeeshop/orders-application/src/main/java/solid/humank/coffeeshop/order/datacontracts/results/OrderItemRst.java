package solid.humank.coffeeshop.order.datacontracts.results;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import lombok.*;
import solid.humank.coffeeshop.order.models.OrderItem;

import java.math.BigDecimal;

@AllArgsConstructor
@Data
@JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY)
public class OrderItemRst {

    @Getter
    @Setter(AccessLevel.PRIVATE)
    private String productId;

    @Getter
    @Setter(AccessLevel.PRIVATE)
    private int qty;

    @Getter
    @Setter(AccessLevel.PRIVATE)
    private BigDecimal price;

    @Getter
    @Setter(AccessLevel.PRIVATE)
    private BigDecimal fee;

    public OrderItemRst(String productId, int qty, BigDecimal price) {
        this.productId = productId;
        this.qty = qty;
        this.price = price;
        this.fee = this.price.multiply(BigDecimal.valueOf(qty));
    }

    public OrderItemRst(OrderItem orderItem) {
        this.productId = orderItem.getProductId();
        this.qty = orderItem.getQty();
        this.price = orderItem.getPrice();
        this.fee = orderItem.fee();
    }
}
