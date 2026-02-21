package solid.humank.coffeeshop.infra.serializations;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import solid.humank.coffeeshop.infra.adapters.CloudWatchEventAdapter;
import solid.humank.ddd.commons.baseclasses.DomainEvent;
import solid.humank.ddd.commons.baseclasses.EntityId;

import java.util.List;

public class DomainEventPublisher {

    Logger logger = LoggerFactory.getLogger(DomainEventPublisher.class);
    CloudWatchEventAdapter cweAdapter;

    public DomainEventPublisher() {
    }

    public void publish(List<DomainEvent<? extends EntityId>> domainEvents) {
        for (DomainEvent de : domainEvents) {
            cweAdapter.publishEvent(de);
        }
    }

}
