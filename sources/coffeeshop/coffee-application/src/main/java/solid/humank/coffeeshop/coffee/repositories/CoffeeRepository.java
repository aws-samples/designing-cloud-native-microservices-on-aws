package solid.humank.coffeeshop.coffee.repositories;

import solid.humank.coffeeshop.coffee.interfaces.ICoffeeRepository;
import solid.humank.coffeeshop.coffee.models.Coffee;
import solid.humank.coffeeshop.coffee.models.CoffeeId;
import solid.humank.coffeeshop.infra.repositories.DDBRepositoryBase;
import solid.humank.coffeeshop.infra.repositories.coffee.CoffeeRepoSpec;
import solid.humank.ddd.commons.baseclasses.Specification;

import java.time.OffsetDateTime;
import java.util.List;

public class CoffeeRepository implements ICoffeeRepository {

    DDBRepositoryBase<Coffee, CoffeeId> repository = new DDBRepositoryBase<>();

    @Override
    public List<Coffee> get(Specification<Coffee> specification, int pageNo, int pageSize) {
        return null;
    }

    @Override
    public CoffeeId generateCoffeeId() {
        return new CoffeeId(this.repository.count(new CoffeeRepoSpec()) + 1, OffsetDateTime.now());
    }

    @Override
    public Coffee getBy(CoffeeId id) {
        return this.repository.get(id);
    }

    @Override
    public Coffee save(Coffee coffee) {
        this.repository.create(coffee);
        return coffee;
    }
}
