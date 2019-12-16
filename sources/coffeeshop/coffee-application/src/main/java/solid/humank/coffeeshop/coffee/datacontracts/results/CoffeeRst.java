package solid.humank.coffeeshop.coffee.datacontracts.results;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import lombok.Data;
import solid.humank.coffeeshop.coffee.models.Coffee;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY)
public class CoffeeRst {

    private List<CoffeeItemRst> items;
    private int status;
    private String id;
    private OffsetDateTime createdDate;
    private OffsetDateTime modifiedDate;

    public CoffeeRst(String id) {
        this.id = id;
    }

    public CoffeeRst(List<Coffee> madeCoffees) {
        items = new ArrayList<>();
        madeCoffees.stream().forEach(coffee -> this.id = coffee.getId().toString());
    }
}
