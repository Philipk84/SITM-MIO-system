package co.icesi.mio.cco.service;

import co.icesi.mio.cco.domain.Datagram;
import co.icesi.mio.cco.domain.RouteMetric;
import co.icesi.mio.cco.domain.Stop;
import co.icesi.mio.cco.repository.CsvStopRepository;
import co.icesi.mio.cco.repository.InMemoryHistoricalRepository;
import co.icesi.mio.cco.repository.InMemoryOperationalRepository;
import com.zeroc.Ice.Current;
import mio.MioService;
import mio.PositionDTO;
import mio.RouteMetricDTO;
import mio.StopDTO;
import java.util.Comparator;
import java.util.List;

public class MioFacade implements MioService {
    private final InMemoryOperationalRepository operationalRepository;
    private final InMemoryHistoricalRepository historicalRepository;
    private final CsvStopRepository stopRepository;
    private final MetricsEngine metricsEngine;

    public MioFacade(InMemoryOperationalRepository operationalRepository,
                     InMemoryHistoricalRepository historicalRepository,
                     CsvStopRepository stopRepository,
                     MetricsEngine metricsEngine) {
        this.operationalRepository = operationalRepository;
        this.historicalRepository = historicalRepository;
        this.stopRepository = stopRepository;
        this.metricsEngine = metricsEngine;
    }

    @Override
    public void receiveDatagram(String rawDatagram, Current current) {
        Datagram datagram = Datagram.parse(rawDatagram);
        operationalRepository.saveCurrent(datagram);
        historicalRepository.save(datagram);
        System.out.println("[CCO] Datagrama recibido: " + rawDatagram);
    }

    @Override
    public PositionDTO[] getCurrentPositions(Current current) {
        return operationalRepository.findCurrentPositions().stream()
                .map(this::toPositionDTO)
                .toArray(PositionDTO[]::new);
    }

    @Override
    public StopDTO[] getStops(Current current) {
        return stopRepository.findAll().stream()
                .map(this::toStopDTO)
                .toArray(StopDTO[]::new);
    }

    @Override
    public StopDTO[] getStopsByRoute(String routeId, Current current) {
        return stopRepository.findByRoute(routeId).stream()
                .map(this::toStopDTO)
                .toArray(StopDTO[]::new);
    }

    @Override
    public PositionDTO[] getRouteTrace(String routeId, Current current) {
        return historicalRepository.findAll().stream()
                .filter(d -> d.getRouteId().equalsIgnoreCase(routeId))
                .sorted(Comparator.comparing(Datagram::getTimestamp))
                .map(this::toPositionDTO)
                .toArray(PositionDTO[]::new);
    }

    @Override
    public RouteMetricDTO[] getAverageSpeedByRouteAndMonth(int year, Current current) {
        List<RouteMetric> metrics = metricsEngine.averageSpeedByRouteAndMonth(historicalRepository.findAll(), year);
        return metrics.stream()
                .map(m -> new RouteMetricDTO(m.getRouteId(), m.getMonth(), m.getAverageSpeedKmh(), m.getSamples()))
                .toArray(RouteMetricDTO[]::new);
    }

    private PositionDTO toPositionDTO(Datagram d) {
        return new PositionDTO(d.getBusId(), d.getRouteId(), d.getLat(), d.getLng(), d.timestampText(), 0.0);
    }

    private StopDTO toStopDTO(Stop s) {
        return new StopDTO(s.getStopId(), s.getName(), s.getRouteId(), s.getLat(), s.getLng(), s.getOrder());
    }
}
