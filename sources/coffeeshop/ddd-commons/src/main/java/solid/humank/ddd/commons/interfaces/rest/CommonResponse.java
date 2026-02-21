package solid.humank.ddd.commons.interfaces.rest;

/**
 * Generic API response wrapper.
 */
public class CommonResponse {

    private Object data;

    public CommonResponse() {
    }

    public CommonResponse(Object data) {
        this.data = data;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
}
