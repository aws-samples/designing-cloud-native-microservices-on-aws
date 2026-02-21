package solid.humank.coffeeshop.inventories.applicationservices;

import solid.humank.coffeeshop.coffee.datacontracts.messages.MakeCoffeeMsg;

public class ConfirmInventorySvc {
    public boolean notAvailableFor(MakeCoffeeMsg request) {

        //TODO Actually call Inventory Web API, wrapped via JAX-RS client
        return false;
    }
}
