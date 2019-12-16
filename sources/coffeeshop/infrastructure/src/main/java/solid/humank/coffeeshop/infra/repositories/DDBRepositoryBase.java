package solid.humank.coffeeshop.infra.repositories;

import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;
import solid.humank.ddd.commons.baseclasses.AggregateRoot;
import solid.humank.ddd.commons.baseclasses.EntityId;
import solid.humank.ddd.commons.baseclasses.Specification;
import solid.humank.ddd.commons.interfaces.IRepository;
import solid.humank.ddd.commons.interfaces.ISelector;

import javax.enterprise.context.Dependent;
import java.util.List;

@Dependent
public class DDBRepositoryBase<T extends AggregateRoot, U extends EntityId> implements IRepository<T, U> {


    DynamoDbClient ddb;

    public DDBRepositoryBase() {
        ddb = DynamoDbClient.builder()
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                .build();
    }

    @Override
    public List<T> all() {
        return null;
    }

    @Override
    public T get(U entityId) {
        return null;
    }

    @Override
    public T get(FunctionalInterface func, Specification<U> by) {
        return null;
    }

    @Override
    public T get(ISelector selector, Specification<U> by) {
        return null;
    }

    @Override
    public T first(ISelector selector, Specification<U> by) {
        return null;
    }

    @Override
    public boolean any(Specification<T> by) {
        return false;
    }

    @Override
    public long count(Specification<T> by) {
        AggregateRootMapper mapper = DDBMapper.getMapper(by.getTargetTable());
        ScanRequest scanRequest = mapper.buildCountScanRequest();
        ScanResponse scanResponse = ddb.scan(scanRequest);
        long currentCount = scanResponse.count();

        return currentCount;
    }

    @Override
    public void create(T aggregateRoot) {

        AggregateRootMapper mapper = DDBMapper.getMapper(aggregateRoot.getClass().getSimpleName());
        PutItemRequest request = mapper.buildPutItemRequest(aggregateRoot);
        ddb.putItem(request);
    }

    @Override
    public int update(T aggregateRoot) {
        return 0;
    }

    @Override
    public void remove(T aggregateRoot) {

    }

}
