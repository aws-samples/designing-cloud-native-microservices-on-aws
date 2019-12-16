package solid.humank.ddd.commons.baseclasses;

public class DomainException extends Exception {

    private String source;
    private Enum errorCode;
    private String errorMessage;

    public DomainException(String errorMessage) {
        super(errorMessage);
    }

    public DomainException(String source, Enum errorCode, String errorMessage, Throwable err) {
        super(errorMessage, err);
        this.source = source;
        this.errorMessage = errorMessage;
        this.errorCode = errorCode;
    }

    public DomainException(String source, Enum errorCode, String errorMessage) {
        super(errorMessage);
        this.source = source;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
    }

    @Override
    public String toString() {
        return String.format("Code:%s - %s, Message: %s .", this.source, this.errorCode, this.errorMessage);
    }

}
