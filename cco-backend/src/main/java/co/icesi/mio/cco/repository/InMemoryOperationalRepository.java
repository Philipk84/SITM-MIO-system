package co.icesi.mio.cco.repository;

import co.icesi.mio.cco.domain.Datagram;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

public class InMemoryOperationalRepository {
    private final ConcurrentMap<String, Datagram> currentByBus = new ConcurrentHashMap<>();

    public void saveCurrent(Datagram datagram) {
        currentByBus.put(datagram.getBusId(), datagram);
    }

    public List<Datagram> findCurrentPositions() {
        return new ArrayList<>(currentByBus.values());
    }
}
