package solid.humank.coffeeshop.coffee.models;


import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import solid.humank.coffeeshop.coffee.commands.MakeCoffee;
import solid.humank.ddd.commons.baseclasses.AggregateRoot;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class Coffee extends AggregateRoot<CoffeeId> {

    final static Logger logger = LoggerFactory.getLogger(Coffee.class);
    final static String DATE_FORMAT = "yyyyMMddHHmmss";

    @Getter
    @Setter(AccessLevel.PRIVATE)
    List<CoffeeItem> coffeeItems;

    @Getter
    @Setter(AccessLevel.PRIVATE)
    String productId;

    @Getter
    @Setter(AccessLevel.PRIVATE)
    OffsetDateTime createdDate;

    @Getter
    @Setter(AccessLevel.PRIVATE)
    OffsetDateTime modifiedDate;

    @Getter
    @Setter(AccessLevel.PRIVATE)
    String orderId;

    @Getter
    @Setter(AccessLevel.PRIVATE)
    String productName;

    @Getter
    @Setter(AccessLevel.PRIVATE)
    private String tableNo;
    @Getter
    @Setter(AccessLevel.PRIVATE)
    private CoffeeStatus status;


    public Coffee(CoffeeId id, String tableNo, List<CoffeeItem> items) {
        this.setId(id);
        this.tableNo = tableNo;
        this.coffeeItems = items;
        this.status = CoffeeStatus.STAYIN;
        this.createdDate = OffsetDateTime.now();
        this.productName = "Americano";
    }

    public static Coffee make(MakeCoffee cmd) {

        Coffee coffee =
                new Coffee(cmd.getId(), cmd.getTableNo(), cmd.getItems());
        //TODO add verify policy.

        //TODO add coffee made event for event sourcing.
        return coffee;
    }

    public String createdDateString() {
        return createdDate.format(DateTimeFormatter.ofPattern(DATE_FORMAT));
    }

    public String modifiedDateString() {
        return
                modifiedDate == null ? "N/A" : modifiedDate.format(DateTimeFormatter.ofPattern(DATE_FORMAT));
    }

}
