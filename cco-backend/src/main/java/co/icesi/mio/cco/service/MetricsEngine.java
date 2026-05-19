package co.icesi.mio.cco.service;

import co.icesi.mio.cco.domain.Datagram;
import co.icesi.mio.cco.domain.RouteMetric;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

public class MetricsEngine {
    public List<RouteMetric> averageSpeedByRouteAndMonth(List<Datagram> datagrams, int year) {
        Map<String, List<Datagram>> byBusRouteMonth = datagrams.stream()
                .filter(d -> d.getTimestamp().getYear() == year)
                .collect(Collectors.groupingBy(d -> d.getBusId() + "|" + d.getRouteId() + "|" + monthKey(d)));

        Map<String, SpeedAccumulator> byRouteMonth = new HashMap<>();

        for (List<Datagram> group : byBusRouteMonth.values()) {
            group.sort(Comparator.comparing(Datagram::getTimestamp));
            for (int i = 1; i < group.size(); i++) {
                Datagram previous = group.get(i - 1);
                Datagram current = group.get(i);
                long seconds = Duration.between(previous.getTimestamp(), current.getTimestamp()).getSeconds();
                if (seconds <= 0) continue;

                double distanceKm = GeoMath.haversineKm(previous.getLat(), previous.getLng(), current.getLat(), current.getLng());
                double hours = seconds / 3600.0;
                double speed = distanceKm / hours;

                String routeMonth = current.getRouteId() + "|" + monthKey(current);
                byRouteMonth.computeIfAbsent(routeMonth, k -> new SpeedAccumulator()).add(speed);
            }
        }

        List<RouteMetric> result = new ArrayList<>();
        byRouteMonth.forEach((key, acc) -> {
            String[] parts = key.split("\\|");
            result.add(new RouteMetric(parts[0], parts[1], acc.average(), acc.samples));
        });

        result.sort(Comparator.comparing(RouteMetric::getRouteId).thenComparing(RouteMetric::getMonth));
        return result;
    }

    private String monthKey(Datagram d) {
        return String.format(Locale.US, "%04d-%02d", d.getTimestamp().getYear(), d.getTimestamp().getMonthValue());
    }

    private static class SpeedAccumulator {
        double total;
        int samples;

        void add(double speed) {
            total += speed;
            samples++;
        }

        double average() {
            return samples == 0 ? 0 : total / samples;
        }
    }
}
