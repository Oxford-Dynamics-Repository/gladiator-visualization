import influxdb_client
from influxdb_client.client.write_api import SYNCHRONOUS
import pandas as pd

from populate_db import PopulateInfluxDB


class QueryInfluxDB(PopulateInfluxDB):
    def __init__(self):
        super().__init__()
        self.query_api = self.client.query_api()

    def query_timebound(self):
        query = """from(bucket: "GLADIATOR")
        |> range(start: 2024-04-10, stop: 2024-04-12)
        |> filter(fn:(r) => r._field == "spatial_latitude" or r._field == "spatial_longitude" or r._field == "spatial_altitude")
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        """
        
        result = self.query_api.query_data_frame(org=self.org_name, query=query)
        return result

if __name__ == "__main__":
    qeryObj = QueryInfluxDB()
    results_list = qeryObj.query_timebound()
    print(results_list)
