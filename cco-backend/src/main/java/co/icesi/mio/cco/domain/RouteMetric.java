package co.icesi.mio.cco.domain;

public class RouteMetric {
    private final String routeId;
    private final String month;
    private final double averageSpeedKmh;
    private final int samples;

    public RouteMetric(String routeId, String month, double averageSpeedKmh, int samples) {
        this.routeId = routeId;
        this.month = month;
        this.averageSpeedKmh = averageSpeedKmh;
        this.samples = samples;
    }

    public String getRouteId() { return routeId; }
    public String getMonth() { return month; }
    public double getAverageSpeedKmh() { return averageSpeedKmh; }
    public int getSamples() { return samples; }
}
