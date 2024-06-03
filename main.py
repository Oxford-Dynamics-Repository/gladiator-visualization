from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from populate_db import populate_main
from query_db import QueryInfluxDB
from datetime import datetime, timedelta, timezone


app = FastAPI()

# In-memory storage for demonstration purposes
data_store = []

class Populate(BaseModel):
    error: str
    description: Optional[str] = None

class Query(BaseModel):
    error: str
    payload: List[str]
    description: Optional[str] = None

@app.post("/populate", response_model=Populate)
def populate():
    populate_main()
    return Populate(error=None, description="Listening to PitchRTI and populating DB at http://localhost:8086")

@app.post("/query", response_model=Query)
def query(start_time, stop_time):
    try:
        qeryObj = QueryInfluxDB()
        results_list = qeryObj.query_timebound(start_time, stop_time)
        return Query(error=None, payload=[results_list.tail(1)], description="")
    except Exception as err:
        error = err
        return Query(error=error, payload=None, description="")

@app.post("/monitor", response_model=Query)
def monitor():
    qeryObj = QueryInfluxDB()

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

    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
