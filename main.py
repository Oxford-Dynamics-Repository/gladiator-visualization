from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from populate_db import populate_main
from query_db import QueryInfluxDB
from datetime import datetime, timedelta, timezone


app = FastAPI()

# In-memory storage for demonstration purposes
data_store = []

class Populate(BaseModel):
    error: Optional[str] = None
    description: Optional[str] = None

class Query(BaseModel):
    error: List[str]
    payload: Optional[List[Any]]
    description: Optional[str] = None

@app.post("/populate", response_model=Populate)
def populate(token):
    # Token is taken from InfluxDB UI (ex: "5ZCHTFdoksYQ2M8PiKDV5p2_X2vK_KuGdNHJ9K8fKeuCYVayUE8psk8lOPu7RRzG_S6jX-cVOgtXWi_Z9XBfJA==")
    populate_main(str(token))
    return Populate(error=None, description="Listening to PitchRTI and populating DB at http://localhost:8086")

@app.post("/query", response_model=Query)
def query(start_time, stop_time, token):
    try:
        qeryObj = QueryInfluxDB(token)
        results_list = qeryObj.query_timebound(start_time, stop_time)
        return Query(error=[], payload=results_list, description="")
    except Exception as err:
        return Query(error=[str(err)], payload=None, description="")

@app.post("/monitor", response_model=Query)
def monitor(token):
    qeryObj = QueryInfluxDB(token)

    current_datetime = datetime.now(timezone.utc)
    curr_dt_format = current_datetime.strftime("%Y-%m-%dT%H:%M:%SZ")
    two_sec_ago_datetime = current_datetime - timedelta(seconds=2)
    twosec_dt_format = two_sec_ago_datetime.strftime("%Y-%m-%dT%H:%M:%SZ")

    try:
        results_list = qeryObj.query_timebound(twosec_dt_format, current_datetime)
        missing_aircraft = QueryInfluxDB.detect_missing_aircraft(results_list)
        return Query(error=None, payload=[missing_aircraft], description="")
    except Exception as err:
        error = err
        return Query(error=error, payload=None, description="")

    
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
