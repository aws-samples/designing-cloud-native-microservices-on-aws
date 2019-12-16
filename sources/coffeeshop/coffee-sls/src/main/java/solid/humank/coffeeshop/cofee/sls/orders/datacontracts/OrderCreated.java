package solid.humank.coffeeshop.cofee.sls.orders.datacontracts;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY)
@EqualsAndHashCode(callSuper = false)
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderCreated {

    String version;
    String id;
    String detailType;
    String source;
    String account;
    String time;
    String region;
    String[] resources;
    BodyDetail detail;


}
