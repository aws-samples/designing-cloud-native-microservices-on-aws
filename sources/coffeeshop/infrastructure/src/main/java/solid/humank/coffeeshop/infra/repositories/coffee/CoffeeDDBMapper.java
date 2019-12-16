package solid.humank.coffeeshop.infra.repositories.coffee;

import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.Select;
import solid.humank.coffeeshop.coffee.models.Coffee;
import solid.humank.coffeeshop.infra.repositories.AggregateRootMapper;
import solid.humank.ddd.commons.baseclasses.AggregateRoot;

import java.util.HashMap;

public class CoffeeDDBMapper extends AggregateRootMapper {

    public static final String TABLE_NAME = "Coffee";

    @Override
    public <T extends AggregateRoot> PutItemRequest buildPutItemRequest(T aggregateRoot) {
        Coffee coffee = (Coffee) aggregateRoot;

        HashMap<String, AttributeValue> item_values = new HashMap();

        item_values.put("seqNo", AttributeValue.builder().n(String.valueOf(coffee.getId().getSeqNo())).build());
        item_values.put("tableNo", AttributeValue.builder().n(coffee.getTableNo()).build());
        item_values.put("productName", AttributeValue.builder().s(String.valueOf(coffee.getProductName())).build());
        item_values.put("coffeeStatus", AttributeValue.builder().n(String.valueOf(coffee.getStatus().getValue())).build());
        item_values.put("createDate", AttributeValue.builder().s(coffee.createdDateString()).build());
        item_values.put("modifyDate", AttributeValue.builder().s(coffee.modifiedDateString()).build());

        PutItemRequest request = PutItemRequest.builder()
                .tableName(TABLE_NAME)
                .item(item_values)
                .build();
        return request;
    }

    @Override
    public ScanRequest buildCountScanRequest() {

        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(TABLE_NAME)
                .select(Select.COUNT)
                .build();

        return scanRequest;

    }
}
