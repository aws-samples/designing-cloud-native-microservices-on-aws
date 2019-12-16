package solid.humank.coffeeshop.cofee.sls.orders;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestStreamHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import solid.humank.coffeeshop.cofee.sls.orders.datacontracts.OrderCreated;
import solid.humank.coffeeshop.coffee.applications.MakeCoffeeSvc;
import solid.humank.coffeeshop.coffee.datacontracts.messages.MakeCoffeeMsg;
import solid.humank.coffeeshop.coffee.datacontracts.results.CoffeeItemRst;
import solid.humank.coffeeshop.coffee.domainservices.CoffeeItemsTranslator;
import solid.humank.coffeeshop.coffee.repositories.CoffeeRepository;
import solid.humank.coffeeshop.inventories.applicationservices.ConfirmInventorySvc;
import solid.humank.ddd.commons.utilities.DomainModelMapper;

import javax.inject.Named;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

@Named("test")
public class OrderCreatedHandler implements RequestStreamHandler {

//    @Inject
//    MakeCoffeeSvc service;

    Logger logger = LoggerFactory.getLogger(OrderCreatedHandler.class);

    @Override
    public void handleRequest(InputStream inputStream, OutputStream outputStream, Context context) throws IOException {

        MakeCoffeeSvc service =
                new MakeCoffeeSvc(new CoffeeRepository(), new ConfirmInventorySvc(), new CoffeeItemsTranslator());

        DomainModelMapper mapper = new DomainModelMapper();
        OrderCreated orderCreated = mapper.readValue(inputStream, OrderCreated.class);
        logger.info(orderCreated.getVersion());
        logger.info(orderCreated.getId());
        logger.info(orderCreated.getDetailType());
        logger.info(orderCreated.getSource());
        logger.info(orderCreated.getAccount());
        logger.info(orderCreated.getTime());
        logger.info(orderCreated.getRegion());
        logger.info(orderCreated.getResources().toString());
        logger.info(orderCreated.getDetail().getTableNo());
        logger.info(orderCreated.getDetail().getEventId());
        logger.info(String.valueOf(orderCreated.getDetail().getOrderItems().size()));
        logger.info(orderCreated.getDetail().getEntityId().toString());

        //TODO : 調用咖啡師的服務, 參照需求文檔找製作美式咖啡的需求
        MakeCoffeeMsg cmd = new MakeCoffeeMsg(orderCreated.getDetail().getTableNo(), transformToCoffeeItemVM(orderCreated));
        service.make(cmd);

        context.getLogger().log("Coffee made...");
        outputStream.write("{\"status\":\"Coffee made!\"}".getBytes());
    }

    private List<CoffeeItemRst> transformToCoffeeItemVM(OrderCreated receivedOrder) {
        List<CoffeeItemRst> result = new ArrayList<>();
        receivedOrder.getDetail().getOrderItems().forEach(orderItem -> {
            result.add(new CoffeeItemRst(orderItem.getProductId()));
        });

        return result;
    }
}
