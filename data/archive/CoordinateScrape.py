# Oxford Dynamics - April 2024

import re
import json

# Function to convert coordinates from ACO to latitude and longitude.
def convert_coordinates_to_degrees(coordinates_str):
    # Find the index where characters change in the string
    split_index = next(i for i, c in enumerate(coordinates_str) if c == "N")
    
    # Split the string into latitude and longitude parts
    latitude_str = coordinates_str[:split_index]
    longitude_str = coordinates_str[split_index:]

    # Extract latitude value and direction
    latitude_value = float(latitude_str) / 100

    # Extract longitude value and direction
    longitude_value = float(longitude_str[1:-1]) / 100
    longitude_direction = longitude_str[-1]
    if longitude_direction == 'W':
        longitude_value *= -1

    return latitude_value, longitude_value

# Save to coordinates into the correct format for GeoJsonLayer.
def save_coordinates_to_geojson(data, file_path):
    feature_collection = {"type": "FeatureCollection", "features": []}
    for index, (_, values) in enumerate(data.items()):
        feature = {
            "type": "Feature",
            "id": index,
            "properties": {},
            "geometry": {
                "type": "Point",
                "coordinates": [values['Longitude'], values['Latitude']]
            }
        }
        feature_collection["features"].append(feature)

    with open(file_path, 'w') as json_file:
        json.dump(feature_collection, json_file)

# Scrape all coordinate data from the ACO.
def scrape_coordinates(file_path):
    coordinates_dict = {}
    
    with open(file_path, 'r') as file:
        file_content = file.read()
        
        # Use regular expression to find all occurrences of coordinates after "LATS:"
        matches = re.findall(r'LATS:(\d+\.\d+[NS]\d+\.\d+[EW])', file_content)
        
        # Store the coordinates in the dictionary
        for index, match in enumerate(matches, start=1):
            latitude, longitude = convert_coordinates_to_degrees(match)
            coordinates_dict[f'Coordinate {index}'] = {'Latitude': latitude, 'Longitude': longitude}
            
    return coordinates_dict


if __name__ == "__main__":
    # Provide the path to your text file containing the data
    file_path = '20230504-CW23-2_DCA_ACO_V1.0-O.txt'

    # Call the function and save the result
    coordinates = scrape_coordinates(file_path)
    save_coordinates_to_geojson(coordinates, "Checkpoints.json")
