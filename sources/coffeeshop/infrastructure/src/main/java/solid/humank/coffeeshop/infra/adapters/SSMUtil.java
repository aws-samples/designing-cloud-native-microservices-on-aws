package solid.humank.coffeeshop.infra.adapters;

import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.services.ssm.SsmClient;
import software.amazon.serverless.ssmcachingclient.SsmParameterCachingClient;

import java.time.Duration;

public class SSMUtil {

    //TODO ...

    public static String getParameter(String paramName) {
        SsmClient ssm = SsmClient.builder()
                .httpClientBuilder(UrlConnectionHttpClient.builder()).build();
        SsmParameterCachingClient client = new SsmParameterCachingClient(ssm, Duration.ofMinutes(1));
        return client.getAsString(paramName);
    }
}
