package solid.humank.ddd.commons.interfaces;

import solid.humank.ddd.commons.baseclasses.AggregateRoot;

@FunctionalInterface
public interface ISelector {

    public <T> T select(AggregateRoot aggregateRoot);
}
