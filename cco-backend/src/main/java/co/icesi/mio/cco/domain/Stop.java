package co.icesi.mio.cco.domain;

public class Stop {
    private final String stopId;
    private final String name;
    private final String routeId;
    private final double lat;
    private final double lng;
    private final int order;

    public Stop(String stopId, String name, String routeId, double lat, double lng, int order) {
        this.stopId = stopId;
        this.name = name;
        this.routeId = routeId;
        this.lat = lat;
        this.lng = lng;
        this.order = order;
    }

    public String getStopId() { return stopId; }
    public String getName() { return name; }
    public String getRouteId() { return routeId; }
    public double getLat() { return lat; }
    public double getLng() { return lng; }
    public int getOrder() { return order; }
}
