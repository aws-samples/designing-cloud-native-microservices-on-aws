package solid.humank.coffeeshop.inventories.applicationservices;

import solid.humank.coffeeshop.coffee.datacontracts.messages.MakeCoffeeMsg;

public class ConfirmInventorySvc {
    public boolean notAvailableFor(MakeCoffeeMsg request) {

        //TODO 實際去呼叫 Inventory Web api, by JAX-RS 封裝調用
        return false;
    }
}
