package solid.humank.coffeeshop.infra.repositories.orders;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.Select;
import solid.humank.coffeeshop.infra.repositories.AggregateRootMapper;
import solid.humank.coffeeshop.order.models.Order;
import solid.humank.ddd.commons.baseclasses.AggregateRoot;
import solid.humank.ddd.commons.utilities.DomainModelMapper;

import java.util.HashMap;

public class OrderDDBMapper extends AggregateRootMapper {

    public static final String TABLE_NAME = "Order";
    Logger logger = LoggerFactory.getLogger(OrderDDBMapper.class);

    @Override
    public <T extends AggregateRoot> PutItemRequest buildPutItemRequest(T aggregateRoot) {
        Order order = (Order) aggregateRoot;
        DomainModelMapper mapper = new DomainModelMapper();

        String orderItemsJson = mapper.writeToJsonString(order.getOrderItems());

        logger.info("orderItemsJson is:" + orderItemsJson);
        HashMap<String, AttributeValue> item_values = new HashMap();

        item_values.put("seqNo", AttributeValue.builder().n(String.valueOf(order.getId().getSeqNo())).build());
        item_values.put("tableNo", AttributeValue.builder().n(order.getTableNo()).build());
        item_values.put("orderStatus", AttributeValue.builder().n(String.valueOf(order.getStatus().getValue())).build());
        item_values.put("items", AttributeValue.builder().s(orderItemsJson).build());
        item_values.put("totalFee", AttributeValue.builder().n(String.valueOf(order.totalFee())).build());
        item_values.put("createDate", AttributeValue.builder().s(order.createdDateString()).build());
        item_values.put("modifyDate", AttributeValue.builder().s(order.modifiedDateString()).build());

        PutItemRequest request = PutItemRequest.builder()
                .tableName(TABLE_NAME)
                .item(item_values)
                .build();
        return request;
    }


    public ScanRequest buildCountScanRequest() {
        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(TABLE_NAME)
                .select(Select.COUNT)
                .build();

        return scanRequest;
    }
}
