package solid.humank.coffeeshop.coffee.models;

import lombok.Data;
import lombok.EqualsAndHashCode;
import solid.humank.ddd.commons.baseclasses.ValueObject;

@Data
@EqualsAndHashCode(callSuper = true)
public class CoffeeItem extends ValueObject<CoffeeItem> {

    private String name;
    private int price;
    private int quantity;

    public CoffeeItem(String name) {
        super();
        this.name = name;
    }

}
