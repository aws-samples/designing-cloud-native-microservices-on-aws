package solid.humank.coffeeshop.coffee.domainservices;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import solid.humank.coffeeshop.coffee.datacontracts.results.CoffeeItemRst;
import solid.humank.coffeeshop.coffee.models.CoffeeItem;
import solid.humank.ddd.commons.interfaces.ITranslator;

import java.util.ArrayList;
import java.util.List;

public class CoffeeItemsTranslator implements ITranslator<List<CoffeeItem>, List<CoffeeItemRst>> {

    Logger logger = LoggerFactory.getLogger(CoffeeItemsTranslator.class);

    @Override
    public List<CoffeeItem> translate(List<CoffeeItemRst> transRequest) {

        List<CoffeeItem> coffeeItemList = new ArrayList<>();
        transRequest.forEach(coffeeItemRst -> {
            coffeeItemList.add(new CoffeeItem(coffeeItemRst.getProduct().getProductName()));
        });

        return coffeeItemList;
    }
}
