module mio {
    struct PositionDTO {
        string busId;
        string routeId;
        double lat;
        double lng;
        string timestamp;
        double speedKmh;
    };
    sequence<PositionDTO> PositionList;

    struct StopDTO {
        string stopId;
        string name;
        string routeId;
        double lat;
        double lng;
        int order;
    };
    sequence<StopDTO> StopList;

    struct RouteMetricDTO {
        string routeId;
        string month;
        double averageSpeedKmh;
        int samples;
    };
    sequence<RouteMetricDTO> RouteMetricList;

    interface MioService {
        void receiveDatagram(string rawDatagram);
        PositionList getCurrentPositions();
        StopList getStops();
        StopList getStopsByRoute(string routeId);
        PositionList getRouteTrace(string routeId);
        RouteMetricList getAverageSpeedByRouteAndMonth(int year);
    };
};
