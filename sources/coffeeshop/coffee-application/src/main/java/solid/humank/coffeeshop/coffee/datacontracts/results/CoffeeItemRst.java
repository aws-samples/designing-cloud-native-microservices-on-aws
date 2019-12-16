package solid.humank.coffeeshop.coffee.datacontracts.results;

import lombok.Data;
import solid.humank.coffeeshop.coffee.models.products.Product;

@Data
public class CoffeeItemRst {

    Product product;

    public CoffeeItemRst(String productId) {
        this.product = new Product(productId);
    }
}
