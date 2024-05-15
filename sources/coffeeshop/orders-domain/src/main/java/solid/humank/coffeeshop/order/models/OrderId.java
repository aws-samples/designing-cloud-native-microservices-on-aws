package solid.humank.coffeeshop.order.models;

import solid.humank.ddd.commons.baseclasses.EntityId;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

public class OrderId extends EntityId {

    public OrderId() {
        this.setAbbr("ord");
    }

    public OrderId(long seqNo, OffsetDateTime createdDate) {
        super(seqNo, createdDate);
        this.setAbbr("ord");
    }

    public static OrderId fromString(String transRequest) {
        String[] idString = transRequest.split("-");
        String dateString = idString[1];

        String formattedDateString = new StringBuilder(dateString)
                .insert(4, "/")
                .insert(7, "/")
                .toString();

        OffsetDateTime createdDate = OffsetDateTime.parse(formattedDateString, 
            DateTimeFormatter.ofPattern("yyyy/MM/dd'T'HHmmss"));
        
        return new OrderId(Long.parseLong(idString[2]), createdDate);
    }

    public OffsetDateTime getCreatedDate() {
        return super.getOccurredDate();
    }
}
