package solid.humank.coffeeshop.coffee.datacontracts.messages;

import lombok.Data;
import solid.humank.coffeeshop.coffee.datacontracts.results.CoffeeItemRst;

import java.util.List;

@Data
public class MakeCoffeeMsg {

    String tableNo;
    List<CoffeeItemRst> items;

    public MakeCoffeeMsg(String tableNo, List<CoffeeItemRst> items) {
        this.tableNo = tableNo;
        this.items = items;
    }

    public List<CoffeeItemRst> getItems() {
        return items;
    }
}
