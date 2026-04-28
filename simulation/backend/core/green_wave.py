"""
Green Wave Controller

Implements the "Green Wave" (Yaşıl Dalğa) traffic signal coordination
strategy for arterial corridors.

The concept: if a vehicle travels at a target speed along a corridor,
every successive traffic light should turn green just as the vehicle arrives.
This is achieved by offsetting each intersection's phase start time by the
travel time from the previous intersection.

This is one of the classic traffic optimization techniques referenced in
the dissertation's test scenarios (Chapter 3.3).
"""


class GreenWaveController:
    """
    Synchronizes traffic lights along a corridor so that a vehicle
    traveling at target_speed_kmh hits green at every intersection.
    """

    def __init__(self):
        self.corridors = []        # list of configured corridors
        self.active = False

    def detect_corridors(self, edges, traffic_lights, outgoing_map):
        """
        Auto-detect linear corridors: sequences of edges connected 
        end-to-end where both ends have traffic lights.
        
        Returns a list of corridors, each being a list of 
        (edge_id, traffic_light_node_id) tuples in order.
        """
        self.corridors = []
        
        # Find edges whose end node has a traffic light
        tl_edges = []
        for edge in edges:
            end_node = edge["v"]
            if end_node in traffic_lights:
                tl_edges.append(edge)

        # Build corridors by following chains of edges
        visited_nodes = set()

        for start_edge in tl_edges:
            start_node = start_edge["v"]
            if start_node in visited_nodes:
                continue

            corridor = [start_edge]
            visited_nodes.add(start_node)

            # Follow outgoing edges from the end node
            current_node = start_node
            for _ in range(10):  # max corridor length
                next_edges = outgoing_map.get(current_node, [])
                # Find next edge that ends at a traffic light
                found = False
                for ne in next_edges:
                    end_n = ne["v"]
                    if end_n in traffic_lights and end_n not in visited_nodes:
                        corridor.append(ne)
                        visited_nodes.add(end_n)
                        current_node = end_n
                        found = True
                        break
                if not found:
                    break

            if len(corridor) >= 2:
                self.corridors.append(corridor)

        return self.corridors

    def apply_green_wave(self, traffic_lights, target_speed_kmh=50.0):
        """
        Apply phase offsets to all detected corridors.
        
        For each corridor, the first intersection starts at offset 0.
        Each subsequent intersection's green phase is delayed by the
        travel time from the previous intersection at target_speed.
        """
        if not self.corridors:
            return {"applied": False, "reason": "No corridors detected"}

        target_speed_ms = target_speed_kmh / 3.6
        results = []

        for corridor in self.corridors:
            cumulative_offset = 0.0
            corridor_info = {"edges": [], "offsets": []}

            for edge in corridor:
                end_node = edge["v"]
                tl = traffic_lights.get(end_node)
                if tl is None:
                    continue

                # Calculate travel time for this edge
                travel_time = edge["length_m"] / max(target_speed_ms, 1.0)
                cumulative_offset += travel_time

                # Apply offset by adjusting cycle_time
                tl.cycle_time = cumulative_offset % self._get_cycle_length(tl)

                corridor_info["edges"].append({
                    "edge_id": edge["id"],
                    "node_id": end_node,
                    "length_m": edge["length_m"],
                    "offset_s": round(cumulative_offset, 1)
                })
                corridor_info["offsets"].append(round(cumulative_offset, 1))

            results.append(corridor_info)

        self.active = True
        return {
            "applied": True,
            "corridors": len(results),
            "target_speed_kmh": target_speed_kmh,
            "details": results
        }

    def _get_cycle_length(self, tl):
        """Calculate total cycle length for a traffic light."""
        return sum(p["duration"] for p in tl.phases) if tl.phases else 60.0

    def disable(self):
        """Disable green wave synchronization."""
        self.active = False

    def to_dict(self):
        """Serialize for frontend."""
        return {
            "active": self.active,
            "corridors_count": len(self.corridors),
            "corridors": [
                {
                    "length": len(c),
                    "edge_ids": [e["id"] for e in c],
                    "total_length_m": round(sum(e["length_m"] for e in c), 1)
                }
                for c in self.corridors
            ]
        }
