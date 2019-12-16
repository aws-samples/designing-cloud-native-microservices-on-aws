package solid.humank.coffeeshop.coffee.models;

import java.util.HashMap;
import java.util.Map;

public enum CoffeeStatus {

    INITIAL(0), PROCESSING(1), STAYIN(2), TOGO(3), CANCEL(4), DELIVERED(5);

    private static Map map = new HashMap();

    static {
        for (CoffeeStatus type : CoffeeStatus.values()) {
            map.put(type.value, type);
        }
    }

    private int value;

    CoffeeStatus(int value) {
        this.value = value;
    }

    public static CoffeeStatus valueOf(int pageType) {
        return (CoffeeStatus) map.get(pageType);
    }

    public int getValue() {
        return value;
    }
}
