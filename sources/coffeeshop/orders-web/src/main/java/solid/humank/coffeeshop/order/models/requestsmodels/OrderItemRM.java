package solid.humank.coffeeshop.order.models.requestsmodels;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderItemRM {


    String productId;
    int qty;
    BigDecimal price;
}
