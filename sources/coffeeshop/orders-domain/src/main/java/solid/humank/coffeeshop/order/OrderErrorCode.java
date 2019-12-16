package solid.humank.coffeeshop.order;

import java.util.HashMap;
import java.util.Map;

public enum OrderErrorCode {
    STATUS_TRANSIT(0),
    ORDER_ID_IS_NULL(1),
    ORDER_ITEMS_ARE_EMPTY_OR_NULL(2),
    TABLE_NO_IS_EMPTY(3),
    PRODUCT_NAME_IS_EMPTY(4),
    PRODUCT_DESCRIPTION_IS_EMPTY(5),
    PRODUCT_DISCOUNT_IS_INAPPROPRIATE(6),
    PRICE_IS_INAPPROPRIATE(7);

    private static Map map = new HashMap<>();

    static {

        for (OrderErrorCode errorCode : OrderErrorCode.values()) {
            map.put(errorCode.value, errorCode);
        }
    }

    private int value;

    OrderErrorCode(int value) {
        this.value = value;
    }

    public static OrderErrorCode valueOf(int errorCode) {
        return (OrderErrorCode) map.get(errorCode);
    }

    public int getValue() {
        return value;
    }
}
