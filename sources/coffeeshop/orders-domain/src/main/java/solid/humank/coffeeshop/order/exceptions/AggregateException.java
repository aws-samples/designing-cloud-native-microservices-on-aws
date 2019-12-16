package solid.humank.coffeeshop.order.exceptions;

import java.util.Arrays;
import java.util.List;

public class AggregateException extends Throwable {
    private final List<Exception> secondaryExceptions;

    public AggregateException(List<Exception> exceptions) {
        this.secondaryExceptions = exceptions;
    }

    public Throwable[] getAllExceptions() {

        int start = 0;
        int size = secondaryExceptions.size();
        final Throwable primary = getCause();
        if (primary != null) {
            start = 1;
            size++;
        }

        Throwable[] all = new Exception[size];

        if (primary != null) {
            all[0] = primary;
        }

        Arrays.fill(all, start, all.length, secondaryExceptions);
        return all;
    }

    public String getMessage() {
        StringBuilder stringBuilder = new StringBuilder();
        for (Exception exception : secondaryExceptions) {
            stringBuilder
                    .append(exception.toString());
        }
        return stringBuilder.toString();
    }
}
