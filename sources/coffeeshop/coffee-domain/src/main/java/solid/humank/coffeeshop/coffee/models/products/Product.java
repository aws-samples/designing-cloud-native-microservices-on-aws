package solid.humank.coffeeshop.coffee.models.products;

import lombok.Data;
import lombok.EqualsAndHashCode;
import solid.humank.ddd.commons.baseclasses.ValueObject;

@Data
@EqualsAndHashCode(callSuper = true)
public class Product extends ValueObject {

    String productId;
    String productName;

    public Product(String productId) {
        this.productId = productId;
    }

}
