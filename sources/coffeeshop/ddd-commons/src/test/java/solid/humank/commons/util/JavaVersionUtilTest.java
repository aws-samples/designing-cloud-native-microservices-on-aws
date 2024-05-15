package solid.humank.commons.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class JavaVersionUtilTest {

    @Test
    public void testIsJava17OrLater() {
        assertTrue(JavaVersionUtil.isJava17OrLater());
    }
}
