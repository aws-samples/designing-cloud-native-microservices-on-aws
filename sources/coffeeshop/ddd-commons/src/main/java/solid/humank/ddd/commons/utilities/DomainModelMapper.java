package solid.humank.ddd.commons.utilities;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.module.paramnames.ParameterNamesModule;

import java.io.IOException;
import java.io.InputStream;

public class DomainModelMapper {

    ObjectMapper mapper;

    public DomainModelMapper() {

//        mapper = new ObjectMapper();
//        mapper.registerModule(new JavaTimeModule());
//        mapper.findAndRegisterModules();
//        mapper.writerWithDefaultPrettyPrinter();

        mapper = new ObjectMapper()
                .registerModule(new ParameterNamesModule())
                .registerModule(new Jdk8Module())
                .registerModule(new JavaTimeModule()); // new module, NOT JSR310Module
    }

    public String writeToJsonString(Object object) {
        String result = null;
        try {
            result = mapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }


        return result;
    }

    public <T> T readValue(String json, Class<T> valueType) {
        T result = null;
        try {
            result = mapper.readValue(json, valueType);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
        return result;
    }

    public <T> T readValue(InputStream inputStream, Class<T> valueType) {
        T result = null;
        try {
            result = mapper.readValue(inputStream, valueType);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return result;
    }
}
