from datetime import datetime
from influxdb_client import InfluxDBClient, BucketsApi, OrganizationsApi, UsersApi
from influxdb_client.client.write_api import SYNCHRONOUS
import json


class PopulateInfluxDB():
    def __init__(self) -> None:
        self.url ="http://localhost:8086"
        self.token = "WEDZvJzihblds_E1aSMTyYGMGYsk5rVenm652NJ5454x9al3VQRIpWl49_ogVKG6WAOWTs1hfxKCjEb1vMI0Rw=="
        self.org_name = "oxdynamics"
        self.bucket = "GLADIATOR"
        self.client = InfluxDBClient(url=self.url, token=self.token, org=self.org_name)
 
    def str_time_to_datetime(self, date_str):
        date_obj = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S.%f")
        influxdb_timestamp = date_obj.strftime("%Y-%m-%dT%H:%M:%SZ")

        return influxdb_timestamp

    def save_to_influxdb(self, data_list):
        write_api = self.client.write_api(write_options=SYNCHRONOUS)

        for data in data_list:
            # Create a Point for each data point
            point = {
                "measurement": "gladiator_entities",
                "tags": {
                    "entityIdentifier": data["entityIdentifier"],
                    "marking": data["marking"]
                },
                "time": self.str_time_to_datetime(data["lastSpatialUpdate"]),
                "fields":{
                    "hlaInstanceName": data["hlaInstanceName"],
                    "damageState": data["damageState"],
                    "forceIdentifier": data["forceIdentifier"],
                    "marking": data["marking"],
                    "entityType": data["entityType"],
                    "spatial_latitude": data["spatial"]["position"]["WGS84"]["latitude"],
                    "spatial_longitude": data["spatial"]["position"]["WGS84"]["longitude"],
                    "spatial_altitude": data["spatial"]["position"]["WGS84"]["altitude"],
                    "spatial_x": data["spatial"]["position"]["ECEF"]["x"],
                    "spatial_y": data["spatial"]["position"]["ECEF"]["y"],
                    "spatial_z": data["spatial"]["position"]["ECEF"]["z"],
                    "spatial_phi": data["spatial"]["orientation"]["phi"],
                    "spatial_psi": data["spatial"]["orientation"]["psi"],
                    "spatial_theta": data["spatial"]["orientation"]["theta"],
                    "spatial_xVelocity": data["spatial"]["velocityVector"]["xVelocity"],
                    "spatial_yVelocity": data["spatial"]["velocityVector"]["yVelocity"],
                    "spatial_zVelocity": data["spatial"]["velocityVector"]["zVelocity"],
                }
            }
        
            # Write the point to InfluxDB
            try:
                write_api.write(self.bucket, self.org_name, point)
            except Exception as err:
                print("Error with writing to DB\n" + err)
        print("Data written successfully")

if __name__ == "__main__":
    influxObj = PopulateInfluxDB()
    with open("/home/stefan/gladiator-visualization/test_file.json") as jf:
        data_list = json.load(jf)

    influxObj.save_to_influxdb(data_list)
