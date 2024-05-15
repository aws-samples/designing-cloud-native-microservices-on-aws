package solid.humank.coffeeshop.order.domainservices;

import solid.humank.coffeeshop.order.models.OrderId;
import solid.humank.ddd.commons.interfaces.ITranslator;

import java.time.OffsetDateTime;

public class IdTranslator implements ITranslator<OrderId, String> {

    @Override
    public OrderId translate(String transRequest) {

        String[] idString = transRequest.split("-");
        String datetimePart = idString[1];
        String seqNumPart = idString[2];

        String formattedDatetime = datetimePart.substring(0, 4) + "/" + 
            datetimePart.substring(4, 6) + "/" + datetimePart.substring(6); 
        
        return new OrderId(Long.parseLong(seqNumPart), OffsetDateTime.parse(formattedDatetime));
    }
}
