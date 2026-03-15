import osmnx as ox
import json

def load_baku_map():
    """
    Downloads a portion of Baku (around Ganjlik Mall) road network.
    Returns both projected (UTM for physics) and unprojected (lat/lng for frontend map) coordinates.
    """
    center_point = (40.4000, 49.8525) 
    
    print("Downloading OSM Data for Baku (r=500m)...")
    try:
        G = ox.graph_from_point(center_point, dist=500, network_type='drive')
        
        # Get unprojected (lat/lng) data for frontend display
        nodes_ll, edges_ll = ox.graph_to_gdfs(G)
        
        # Get projected (UTM meters) data for physics simulation
        G_proj = ox.project_graph(G)
        nodes_proj, edges_proj = ox.graph_to_gdfs(G_proj)
        
        import pandas as pd
        
        graph_data = {
            "center": {"lat": center_point[0], "lng": center_point[1]},
            "nodes": {},
            "edges": []
        }
        
        # Process Nodes with BOTH coordinate systems
        for osmid, row in nodes_ll.iterrows():
            proj_row = nodes_proj.loc[osmid]
            graph_data["nodes"][str(osmid)] = {
                "lat": float(row['y']),  # Latitude for Leaflet
                "lng": float(row['x']),  # Longitude for Leaflet
                "utm_x": float(proj_row['x']),  # UTM X for physics
                "utm_y": float(proj_row['y'])   # UTM Y for physics
            }
            
        # Process Edges
        seen_edges = set()
        for idx, row in edges_proj.iterrows():
            u = str(idx[0])
            v = str(idx[1])
            edge_id = f"{u}_{v}"
            
            if edge_id in seen_edges:
                continue
            seen_edges.add(edge_id)
            
            lanes = row.get('lanes', 1)
            if pd.isna(lanes): lanes = 1
            if isinstance(lanes, list): lanes = lanes[0]
            try: lanes = int(float(lanes))
            except: lanes = 1
                
            maxspeed = row.get('maxspeed', 50)
            if pd.isna(maxspeed): maxspeed = 50.0
            if isinstance(maxspeed, list): maxspeed = maxspeed[0]
            try: maxspeed = float(maxspeed)
            except: maxspeed = 50.0
                
            length = float(row['length'])
            
            # Get road name if available
            name = row.get('name', '')
            try:
                if pd.isna(name): name = ''
            except (ValueError, TypeError):
                pass
            if isinstance(name, list): name = name[0]
            
            graph_data["edges"].append({
                "id": edge_id,
                "u": u,
                "v": v,
                "lanes": lanes,
                "maxspeed_kmh": maxspeed,
                "length_m": round(length, 2),
                "name": str(name)
            })
            
        print(f"Map loaded! Nodes: {len(graph_data['nodes'])}, Edges: {len(graph_data['edges'])}")
        return graph_data
        
    except Exception as e:
        print(f"Failed to load OSM data: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    data = load_baku_map()
    if data:
        with open("baku_map.json", "w", encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print("Exported to baku_map.json")
