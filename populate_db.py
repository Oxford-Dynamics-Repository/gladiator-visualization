import ast
from datetime import datetime
import os
import queue
import threading
import time
from influxdb_client import InfluxDBClient, BucketsApi, OrganizationsApi, UsersApi
from influxdb_client.client.write_api import SYNCHRONOUS
import json
import requests


class PopulateInfluxDB():
    def __init__(self, gladiator_url) -> None:
        self.url ="http://localhost:8086"
        self.token = "WEDZvJzihblds_E1aSMTyYGMGYsk5rVenm652NJ5454x9al3VQRIpWl49_ogVKG6WAOWTs1hfxKCjEb1vMI0Rw=="
        self.org_name = "oxdynamics"
        self.bucket = "GLADIATOR"
        self.client = InfluxDBClient(url=self.url, token=self.token, org=self.org_name)
        self.monitored_aircraft_file = os.getcwd() + "/monitored_aircraft.json"
        self.monitored_aircraft_list(gladiator_url)
 
    def str_time_to_datetime(self, date_str):
        date_obj = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S.%f")
        influxdb_timestamp = date_obj.strftime("%Y-%m-%dT%H:%M:%SZ")

        return influxdb_timestamp
    
    def monitored_aircraft_list(self, url):
        response = requests.request("GET", url, data="")
        clean_response = ast.literal_eval(response.text)
        aircraft_list = []
        for aircraft_data in clean_response:
            aircraft_list.append(aircraft_data["entityIdentifier"])
        
        with open(self.monitored_aircraft_file, "w") as jf:
            json.dump({"aircraft": aircraft_list}, jf)

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
    
    # Function to continuously query endpoint and enqueue data
    def endpoint_query_and_enqueue(self, queue, url):
        while True:
            response = requests.request("GET", url, data="")
            clean_response = ast.literal_eval(response.text)
            queue.put(clean_response)
            # Query endpoint every second
            time.sleep(1)

    # Function to dequeue data and write to database
    def dequeue_and_db_write(self, queue):
        while True:
            data = queue.get()
            self.save_to_influxdb(data)


if __name__ == "__main__":

    gladiator_url = "http://johanndiep:9900/api/objects/aircrafts/"
    influxObj = PopulateInfluxDB(gladiator_url)
    data_queue = queue.Queue()

    # Start separate threads for querying and writing
    query_thread = threading.Thread(target=influxObj.endpoint_query_and_enqueue, args=(data_queue, gladiator_url,))
    write_thread = threading.Thread(target=influxObj.dequeue_and_db_write, args=(data_queue,))

    query_thread.start()
    write_thread.start()
    # Wait for threads to finish
    # (thread is set to while True, so needs to be interrupted by command)
    query_thread.join()
    write_thread.join()

