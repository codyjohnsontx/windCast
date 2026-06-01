import type { Spot } from "../types";

export const MOCK_SPOTS: Spot[] = [
  {
    id: "bird-island-basin",
    name: "Bird Island Basin",
    latitude: 27.4661,
    longitude: -97.3122,
    sportTypes: ["kiteboarding", "wing_foiling"],
    idealWindDirections: ["SE", "ESE", "S", "SSE"],
    unsafeWindDirections: ["N", "NNW", "NW", "WNW"],
    minWindMph: 14,
    idealWindMph: [18, 28],
    maxWindMph: 38,
    notes:
      "Shallow flat-water lagoon inside Padre Island National Seashore. Watch for shallow grass beds at the south end. Bring a launching partner — beach can be busy on weekends.",
  },
  {
    id: "texas-city-dike",
    name: "Texas City Dike",
    latitude: 29.3856,
    longitude: -94.8983,
    sportTypes: ["kiteboarding", "wing_foiling"],
    idealWindDirections: ["S", "SSE", "SE"],
    unsafeWindDirections: ["N", "NNW", "NW"],
    minWindMph: 13,
    idealWindMph: [16, 26],
    maxWindMph: 35,
    notes:
      "Long jetty into Galveston Bay. South wind is the call — anything north blows you straight into the rocks. Park near the end and walk in.",
  },
  {
    id: "port-aransas",
    name: "Port Aransas",
    latitude: 27.8339,
    longitude: -97.0611,
    sportTypes: ["kiteboarding", "wing_foiling", "downwind_foiling"],
    idealWindDirections: ["SE", "E", "ESE"],
    unsafeWindDirections: ["W", "WNW", "NW"],
    minWindMph: 12,
    idealWindMph: [15, 25],
    maxWindMph: 32,
    notes:
      "Beach launch with rolling Gulf swell. Great for downwinders along the beach when wind is steady SE. Watch for swimmers in summer.",
  },
  {
    id: "south-padre",
    name: "South Padre Island",
    latitude: 26.1118,
    longitude: -97.1681,
    sportTypes: ["kiteboarding", "wing_foiling", "downwind_foiling"],
    idealWindDirections: ["SE", "E", "ESE", "S"],
    unsafeWindDirections: ["W", "WNW", "NW"],
    minWindMph: 12,
    idealWindMph: [16, 26],
    maxWindMph: 34,
    notes:
      "Bay-side flat water or ocean side with swell. Choose your venue based on wind direction. The Flats is great for foiling once tide is up.",
  },
  {
    id: "lake-travis",
    name: "Lake Travis",
    latitude: 30.4042,
    longitude: -97.9089,
    sportTypes: ["kiteboarding", "wing_foiling"],
    idealWindDirections: ["S", "SSE", "SSW"],
    unsafeWindDirections: ["N", "NNW", "NE"],
    minWindMph: 10,
    idealWindMph: [12, 22],
    maxWindMph: 28,
    notes:
      "Inland lake — wind is gustier than the coast. Mansfield Dam area is the usual launch. No swell, smooth chop on a good south day.",
  },
];
