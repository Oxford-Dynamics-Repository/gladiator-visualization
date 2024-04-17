from influxdb_client import InfluxDBClient, BucketsApi, OrganizationsApi, UsersApi
from influxdb_client.client.write_api import SYNCHRONOUS
import json


class PopulateInfluxDB():
    def __init__(self) -> None:
        self.url ="http://localhost:8086"
        self.token = "plpkDlOyUS_vRauqZG6NHcgD-7nuC5lO9FkUpdRsaAtU_IlCMHMt4lTyBN9-hq2TiJ3oAalX8PCyo-BH6EBXHw=="
        self.org_name = "oxdynamics"
        self.bucket = "GLADIATOR"
        self.client = InfluxDBClient(url=self.url, token=self.token, org=self.org_name)
 

    def save_to_influxdb(self, data_list):
        write_api = self.client.write_api(write_options=SYNCHRONOUS)

        for data in data_list:
            # Create a Point for each data point
            point = {
                "measurement": "gladiator_entities",
                "time": data["lastSpatialUpdate"],
                "fields":{
                    "hlaInstanceName": data["hlaInstanceName"],
                    "damageState": data["damageState"],
                    "forceIdentifier": data["forceIdentifier"],
                    "marking": data["marking"],
                    "entityType": data["entityType"],
                    "spatial": data["spatial"]
                }
            }
        
        # Write the point to InfluxDB
        write_api.write(self.bucket, self.org_name, point)
               

if __name__ == "__main__":
    influxObj = PopulateInfluxDB()
    with open("/home/stefan/gladiator-visualization/test_file.json") as jf:
        data_list = json.load(jf)

    influxObj.save_to_influxdb(data_list)
