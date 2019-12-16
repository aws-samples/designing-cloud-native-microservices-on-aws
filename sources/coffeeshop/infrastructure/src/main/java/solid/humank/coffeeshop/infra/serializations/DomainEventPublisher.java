package solid.humank.coffeeshop.infra.serializations;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import solid.humank.coffeeshop.infra.adapters.CloudWatchEventAdapter;
import solid.humank.ddd.commons.baseclasses.DomainEvent;
import solid.humank.ddd.commons.baseclasses.EntityId;

import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import java.util.List;

@RequestScoped
public class DomainEventPublisher {

    Logger logger = LoggerFactory.getLogger(DomainEventPublisher.class);
    @Inject
    CloudWatchEventAdapter cweAdapter;

    public DomainEventPublisher() {
    }

    public void publish(List<DomainEvent<? extends EntityId>> domainEvents) {
        for (DomainEvent de : domainEvents) {
            cweAdapter.publishEvent(de);
        }
    }

}
