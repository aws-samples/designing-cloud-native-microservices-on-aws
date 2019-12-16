import org.junit.jupiter.api.Test;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.services.ssm.SsmClient;
import software.amazon.serverless.ssmcachingclient.SsmParameterCachingClient;

import java.time.Duration;

public class SSMTest {

    @Test
    public void ssmTest() {


        SsmClient ssm = SsmClient.builder()
                .httpClientBuilder(UrlConnectionHttpClient.builder()).build();

        String path1 = "/coffeeshop/events/ordercreated/event_source";
        String path2 = "/coffeeshop/events/ordercreated/event_arn";
        SsmParameterCachingClient client = new SsmParameterCachingClient(ssm, Duration.ofMinutes(1));
        String stringParameter1 = client.getAsString(path1);
        String stringParameter2 = client.getAsString(path2);
        System.out.println("event source: " + stringParameter1);
        System.out.println("event arn: " + stringParameter2);

    }
}
