import json
import influxdb_client
from influxdb_client.client.write_api import SYNCHRONOUS
import pandas as pd

from populate_db import PopulateInfluxDB


class QueryInfluxDB(PopulateInfluxDB):
    def __init__(self, token):
        super().__init__(token)
        self.query_api = self.client.query_api()

    def query_timebound(self, start_date, stop_date):
        query = """from(bucket: "GLADIATOR")
        |> range(start: {start_date}, stop: {stop_date})
        |> filter(fn:(r) => r["_field"] == "spatial_latitude" or r["_field"] == "spatial_longitude" or r["_field"] == "spatial_altitude")
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        """.format(start_date=start_date, stop_date=stop_date)
        
        result = self.query_api.query_data_frame(org=self.org_name, query=query)
        return result
    
    def detect_missing_aircraft(self, db_results):
        with open(self.monitored_aircraft_file, "r") as jf:
            monitored_aircraft = set(json.load(jf))
        current_aircraft = []
        for result in db_results:
            current_aircraft.append(result["entityIdentifier"])
        
        # relies on assumption that "monitored_aircraft" is the full list
        # and "current_aircraft" is <= "monitored_aircraft"
        return monitored_aircraft - set(current_aircraft)
        

if __name__ == "__main__":
    qeryObj = QueryInfluxDB()
    start_time = "2024-05-08T00:00:00Z"
    stop_time = "2024-05-10T00:00:00Z"
    results_list = qeryObj.query_timebound(start_time, stop_time)
    print(results_list.tail(1))
