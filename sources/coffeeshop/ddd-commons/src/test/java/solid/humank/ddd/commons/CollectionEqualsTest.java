package solid.humank.ddd.commons;


import lombok.Data;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class CollectionEqualsTest {


    @Test
    public void timeTest() {
        OffsetDateTime time = OffsetDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmSS");
        System.out.printf(time.format(formatter).toString());
    }

    @Test
    public void checkToString() {
        String test = String.format("Code:%s - %s, Message: %s", "123", "456", "789");
        String expected = "Code:123 - 456, Message: 789";
        assertEquals(test, expected);
    }

    @Test
    public void check_2_collections_to_see_if_equals() {

        MyObject sut1 = new MyObject("Kim", "ABC", 1);
        MyObject sut2 = new MyObject("Kao", "DEF", 2);
        List<MyObject> a1 = new ArrayList<MyObject>();
        List<MyObject> a2 = new ArrayList<MyObject>();

        a1.add(sut1);
        a2.add(sut2);
        boolean result = a1.equals(a2);
        assertNotEquals(sut1, sut2);
        assertFalse(result);
    }

    enum status {
        OPEN, CLOSE;
    }
}


@Data
class MyObject {
    String name;
    String address;
    int height;

    public MyObject(String name, String address, int height) {
        this.name = name;
        this.address = address;
        this.height = height;
    }
}