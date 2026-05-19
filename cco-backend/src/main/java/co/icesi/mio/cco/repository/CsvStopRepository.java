package co.icesi.mio.cco.repository;

import co.icesi.mio.cco.domain.Stop;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class CsvStopRepository {
    private final List<Stop> stops;

    public CsvStopRepository(String csvPath) {
        this.stops = load(csvPath);
    }

    private List<Stop> load(String csvPath) {
        List<Stop> result = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new FileReader(csvPath))) {
            String line;
            boolean first = true;
            while ((line = reader.readLine()) != null) {
                if (first) { first = false; continue; }
                if (line.trim().isEmpty()) continue;
                String[] p = line.split(",");
                result.add(new Stop(
                        p[0].trim(), p[1].trim(), p[2].trim(),
                        Double.parseDouble(p[3].trim()),
                        Double.parseDouble(p[4].trim()),
                        Integer.parseInt(p[5].trim())
                ));
            }
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo cargar el CSV de paradas: " + csvPath, e);
        }
        return result;
    }

    public List<Stop> findAll() {
        return stops.stream().sorted(Comparator.comparing(Stop::getRouteId).thenComparingInt(Stop::getOrder)).collect(Collectors.toList());
    }

    public List<Stop> findByRoute(String routeId) {
        return stops.stream()
                .filter(s -> s.getRouteId().equalsIgnoreCase(routeId))
                .sorted(Comparator.comparingInt(Stop::getOrder))
                .collect(Collectors.toList());
    }
}
