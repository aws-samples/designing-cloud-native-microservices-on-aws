package solid.humank.coffeeshop.order.exceptions;

import solid.humank.ddd.commons.baseclasses.DomainException;

public class StatusTransitionException extends DomainException {

    public StatusTransitionException(String errorMessage) {
        super(errorMessage);
    }

    public StatusTransitionException(String source, Enum errorCode, String errorMessage, Throwable err) {
        super(source, errorCode, errorMessage, err);
    }

}
