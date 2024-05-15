package solid.humank.commons.util;

public class JavaVersionUtil {

    public static boolean isJava17OrLater() {
        String javaVersion = System.getProperty("java.version");
        return javaVersion.startsWith("17") || javaVersion.compareTo("17") >= 0;
    }
}
