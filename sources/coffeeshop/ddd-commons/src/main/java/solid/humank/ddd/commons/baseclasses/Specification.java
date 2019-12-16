package solid.humank.ddd.commons.baseclasses;

import java.util.function.Predicate;

public class Specification<T> {


    protected T entity;
    protected Predicate<T> predicate;
    protected String targetTable;

    protected Specification() {
    }

    public Specification(Predicate<T> predicate) {

        this.predicate = predicate;
    }

    public Specification(T entity, Predicate predicate) {
        this.entity = entity;
        this.predicate = predicate;
    }

    public String getTargetTable() {
        return targetTable;
    }

    public void setTargetTable(String targetTable) {
        this.targetTable = targetTable;
    }

    public boolean isSatisfy() {
        return this.predicate.test(entity);
    }

}
