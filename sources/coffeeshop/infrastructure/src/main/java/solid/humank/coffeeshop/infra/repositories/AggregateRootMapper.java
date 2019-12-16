package solid.humank.coffeeshop.infra.repositories;

import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import solid.humank.ddd.commons.baseclasses.AggregateRoot;

public abstract class AggregateRootMapper {

    ;

    public abstract <T extends AggregateRoot> PutItemRequest buildPutItemRequest(T aggregateRoot);

    public abstract ScanRequest buildCountScanRequest();
}
