package solid.humank.coffeeshop.coffee.models;

import solid.humank.ddd.commons.baseclasses.EntityId;

import java.time.OffsetDateTime;

public class CoffeeId extends EntityId {
    public CoffeeId() {
        this.setAbbr("cof");
    }

    public CoffeeId(long seqNo, OffsetDateTime createdDate) {
        super(seqNo, createdDate);
        this.setAbbr("cof");
    }
}
