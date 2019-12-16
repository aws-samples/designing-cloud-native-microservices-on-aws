package solid.humank.coffeeshop.order.exceptions;

import solid.humank.ddd.commons.baseclasses.DomainException;

public class OrderItemEmptyException extends DomainException {
    public OrderItemEmptyException(String errorMessage) {
        super(errorMessage);
    }

    public OrderItemEmptyException(String source, Enum errorCode, String errorMessage, Throwable err) {
        super(source, errorCode, errorMessage, err);
    }

    public OrderItemEmptyException(String source, Enum errorCode, String errorMessage) {
        super(source, errorCode, errorMessage);
    }
}
