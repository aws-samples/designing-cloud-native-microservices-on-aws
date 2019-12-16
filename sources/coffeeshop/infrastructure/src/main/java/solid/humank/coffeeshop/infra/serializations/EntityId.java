package solid.humank.coffeeshop.infra.serializations;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EntityId {
    String abbr;
    long seqNo;
    OffsetDateTime occurredDate;
}
