package solid.humank.ddd.commons.baseclasses;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

public abstract class Entity<T extends EntityId> {

    @Getter(AccessLevel.PUBLIC)
    protected List<DomainEvent<? extends EntityId>> domainEvents = new ArrayList<>();
    @Getter(AccessLevel.PUBLIC)
    @Setter(AccessLevel.PROTECTED)
    T id;
    private boolean suppressEvent = false;

    protected void applyEvent(DomainEvent<T> event) {
        if (suppressEvent) return;
        this.domainEvents.add(event);
    }

    protected void suppressEvent() {
        suppressEvent = true;
    }

    protected void unSuppressedEvent() {
        suppressEvent = false;
    }

}
