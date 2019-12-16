package solid.humank.ddd.commons.interfaces;

public interface ITranslator<O, I> {

    O translate(I transRequest);
}
