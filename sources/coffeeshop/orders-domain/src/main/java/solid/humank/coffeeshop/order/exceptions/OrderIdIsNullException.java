package solid.humank.coffeeshop.order.exceptions;

import solid.humank.ddd.commons.baseclasses.DomainException;

public class OrderIdIsNullException extends DomainException {

    public OrderIdIsNullException(String errorMessage) {
        super(errorMessage);
    }

    public OrderIdIsNullException(String source, Enum errorCode, String errorMessage, Throwable err) {
        super(source, errorCode, errorMessage, err);
    }

    public OrderIdIsNullException(String source, Enum errorCode, String errorMessage) {
        super(source, errorCode, errorMessage);
    }
}
