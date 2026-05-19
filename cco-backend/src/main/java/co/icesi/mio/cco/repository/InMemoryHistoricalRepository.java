package co.icesi.mio.cco.repository;

import co.icesi.mio.cco.domain.Datagram;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class InMemoryHistoricalRepository {
    private final List<Datagram> historical = Collections.synchronizedList(new ArrayList<>());

    public void save(Datagram datagram) {
        historical.add(datagram);
    }

    public List<Datagram> findAll() {
        synchronized (historical) {
            return new ArrayList<>(historical);
        }
    }
}
