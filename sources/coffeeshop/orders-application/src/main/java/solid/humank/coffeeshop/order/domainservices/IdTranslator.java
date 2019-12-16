package solid.humank.coffeeshop.order.domainservices;

import solid.humank.coffeeshop.order.models.OrderId;
import solid.humank.ddd.commons.interfaces.ITranslator;

import java.time.OffsetDateTime;

public class IdTranslator implements ITranslator<OrderId, String> {

    @Override
    public OrderId translate(String transRequest) {

        String[] idString = transRequest.split("-");
        StringBuilder sb = new StringBuilder(idString[1]);

        sb.insert(4, "/");
        sb.insert(7, "/");
        return new OrderId(Long.valueOf(idString[2]), OffsetDateTime.parse(idString[1]));
    }
}
