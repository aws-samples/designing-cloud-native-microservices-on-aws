package solid.humank.coffeeshop.order.models;

import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import static org.junit.jupiter.api.Assertions.*;

class OrderIdTest {

    @Test
    void fromString_givenValidString_shouldParseCorrectly() {
        // Arrange
        String transRequest = "ord-20230515113015-123";

        // Act
        OrderId orderId = OrderId.fromString(transRequest);

        // Assert
        assertEquals(123L, orderId.getSeqNo());
        assertEquals(OffsetDateTime.of(2023, 5, 15, 11, 30, 15, 0, ZoneOffset.UTC), orderId.getCreatedDate());
    }

}
