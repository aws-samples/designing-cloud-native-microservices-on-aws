package solid.humank.coffeeshop.order.exceptions;

import solid.humank.ddd.commons.baseclasses.DomainException;

public class TableNoEmptyException extends DomainException {
    public TableNoEmptyException(String errorMessage) {
        super(errorMessage);
    }

    public TableNoEmptyException(String source, Enum errorCode, String errorMessage, Throwable err) {
        super(source, errorCode, errorMessage, err);
    }

    public TableNoEmptyException(String source, Enum errorCode, String errorMessage) {
        super(source, errorCode, errorMessage);
    }
}
