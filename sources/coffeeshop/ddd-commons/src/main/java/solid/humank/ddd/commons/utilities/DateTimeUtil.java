package solid.humank.ddd.commons.utilities;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

public class DateTimeUtil {

    public static String toFormattedDate(OffsetDateTime dateTime) {
        return dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    public static OffsetDateTime toOffsetDateTime(String dateTime) {
        return OffsetDateTime.parse(dateTime, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
