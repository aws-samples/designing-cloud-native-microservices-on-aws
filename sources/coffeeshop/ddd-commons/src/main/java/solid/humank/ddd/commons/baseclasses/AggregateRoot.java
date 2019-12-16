package solid.humank.ddd.commons.baseclasses;

import java.util.Collection;

public abstract class AggregateRoot<T extends EntityId> extends Entity<EntityId> {

    Collection<DomainEvent> domainEvents;

}