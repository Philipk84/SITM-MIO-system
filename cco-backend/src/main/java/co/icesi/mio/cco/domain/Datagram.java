package co.icesi.mio.cco.domain;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Datagram {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final String busId;
    private final String routeId;
    private final double lat;
    private final double lng;
    private final LocalDateTime timestamp;

    public Datagram(String busId, String routeId, double lat, double lng, LocalDateTime timestamp) {
        this.busId = busId;
        this.routeId = routeId;
        this.lat = lat;
        this.lng = lng;
        this.timestamp = timestamp;
    }

    public static Datagram parse(String raw) {
        String[] parts = raw.split(",");
        if (parts.length != 5) {
            throw new IllegalArgumentException("Datagrama invalido. Formato esperado: busId,routeId,lat,lng,timestamp. Valor: " + raw);
        }
        return new Datagram(
                parts[0].trim(),
                parts[1].trim(),
                Double.parseDouble(parts[2].trim()),
                Double.parseDouble(parts[3].trim()),
                LocalDateTime.parse(parts[4].trim(), FORMATTER)
        );
    }

    public String getBusId() { return busId; }
    public String getRouteId() { return routeId; }
    public double getLat() { return lat; }
    public double getLng() { return lng; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public String timestampText() { return timestamp.format(FORMATTER); }
}
