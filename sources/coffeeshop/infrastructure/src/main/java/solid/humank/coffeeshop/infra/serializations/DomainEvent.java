package solid.humank.coffeeshop.infra.serializations;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import solid.humank.ddd.commons.baseclasses.EntityId;

import java.time.OffsetDateTime;
import java.util.UUID;

public class DomainEvent<T extends EntityId> {

    @Getter(AccessLevel.PUBLIC)
    @Setter(AccessLevel.PUBLIC)
    protected T entityId;
    @Getter(AccessLevel.PUBLIC)
    @Setter(AccessLevel.PRIVATE)
    private UUID eventId;
    @Getter(AccessLevel.PUBLIC)
    @Setter(AccessLevel.PRIVATE)
    private OffsetDateTime occurredDate;

    protected DomainEvent() {
        this.eventId = UUID.randomUUID();
        this.occurredDate = OffsetDateTime.now();
    }
}