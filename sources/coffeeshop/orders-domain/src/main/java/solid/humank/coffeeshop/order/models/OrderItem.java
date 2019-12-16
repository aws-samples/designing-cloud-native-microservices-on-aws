package solid.humank.coffeeshop.order.models;

import io.quarkus.runtime.annotations.RegisterForReflection;
import lombok.EqualsAndHashCode;
import solid.humank.ddd.commons.baseclasses.ValueObject;

import java.math.BigDecimal;

@RegisterForReflection
@EqualsAndHashCode(callSuper = false)

public class OrderItem extends ValueObject<OrderItem> {

    String productId;
    int qty;
    BigDecimal price;

    public OrderItem() {
    }

    public OrderItem(String productId, int qty, BigDecimal prices) {
        this.productId = productId;
        this.qty = qty;
        this.price = prices;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public int getQty() {
        return qty;
    }

    public void setQty(int qty) {
        this.qty = qty;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal fee() {
        return this.price.multiply(BigDecimal.valueOf(qty));
    }

}
