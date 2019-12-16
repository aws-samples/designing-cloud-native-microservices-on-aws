package solid.humank.ddd.commons.interfaces;

import solid.humank.ddd.commons.baseclasses.AggregateRoot;
import solid.humank.ddd.commons.baseclasses.EntityId;

public interface IFactory<T extends AggregateRoot, U extends EntityId> {

    T create(Object param);
}
