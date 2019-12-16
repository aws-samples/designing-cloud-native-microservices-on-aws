package solid.humank.coffeeshop.coffee.applications;

import solid.humank.coffeeshop.coffee.commands.MakeCoffee;
import solid.humank.coffeeshop.coffee.datacontracts.messages.MakeCoffeeMsg;
import solid.humank.coffeeshop.coffee.datacontracts.results.CoffeeItemRst;
import solid.humank.coffeeshop.coffee.datacontracts.results.CoffeeRst;
import solid.humank.coffeeshop.coffee.domainservices.CoffeeItemsTranslator;
import solid.humank.coffeeshop.coffee.interfaces.ICoffeeRepository;
import solid.humank.coffeeshop.coffee.models.Coffee;
import solid.humank.coffeeshop.coffee.models.CoffeeId;
import solid.humank.coffeeshop.coffee.models.CoffeeItem;
import solid.humank.coffeeshop.coffee.repositories.CoffeeRepository;
import solid.humank.coffeeshop.inventories.applicationservices.ConfirmInventorySvc;
import solid.humank.ddd.commons.interfaces.ITranslator;

import javax.inject.Inject;
import java.util.ArrayList;
import java.util.List;

public class MakeCoffeeSvc {

    @Inject
    public ICoffeeRepository repository;
    @Inject
    public ITranslator<List<CoffeeItem>, List<CoffeeItemRst>> translator;
    @Inject
    ConfirmInventorySvc confirmInventorySvc;

    public MakeCoffeeSvc() {
    }

    public MakeCoffeeSvc(CoffeeRepository coffeeRepository, ConfirmInventorySvc confirmInventorySvc, CoffeeItemsTranslator coffeeItemsTranslator) {
        this.repository = coffeeRepository;
        this.confirmInventorySvc = confirmInventorySvc;
        this.translator = coffeeItemsTranslator;
    }

    public CoffeeRst make(MakeCoffeeMsg request) {

        if (confirmInventorySvc.notAvailableFor(request)) {
            return new CoffeeRst("INVENTORY_IS_NOT_AVAILABLE_FOR_THE_REQUEST");
        }

        List<CoffeeItem> items = this.translator.translate(request.getItems());
        List<Coffee> madeCoffees = new ArrayList<>();

        items.stream().forEach(coffeeItem -> {
            CoffeeId coffeeId = this.repository.generateCoffeeId();
            MakeCoffee cmd = new MakeCoffee(coffeeId, request.getTableNo(), items);
            Coffee madeCoffee = Coffee.make(cmd);
            this.repository.save(madeCoffee);
            madeCoffees.add(madeCoffee);
        });

        return new CoffeeRst(madeCoffees);
    }


}
