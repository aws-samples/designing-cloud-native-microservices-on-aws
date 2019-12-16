package solid.humank.coffeeshop.coffee.commands;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import solid.humank.coffeeshop.coffee.models.CoffeeId;
import solid.humank.coffeeshop.coffee.models.CoffeeItem;

import java.util.List;

public class MakeCoffee {

    @Getter
    @Setter(AccessLevel.PRIVATE)
    CoffeeId id;

    @Getter
    @Setter(AccessLevel.PRIVATE)
    String tableNo;

    @Getter
    @Setter(AccessLevel.PRIVATE)
    List<CoffeeItem> items;


    public MakeCoffee(CoffeeId id, String tableNo, List<CoffeeItem> items) {
        this.id = id;
        this.tableNo = tableNo;
        this.items = items;
    }
}
