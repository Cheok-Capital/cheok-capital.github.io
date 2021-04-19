
import csv
from datetime import datetime, timezone
import json

data = {
    'data': []
}

with open('utils/spy.csv', newline='') as f:
    for row in csv.reader(f):
        d = datetime.strptime(row[1], "%d-%b-%Y").replace(tzinfo=timezone.utc)
        millis = d.timestamp() * 1000
        data['data'].append({
            'timestamp': int(millis),
            'open': float(row[2]),
            'high': float(row[3]),
            'low': float(row[4]),
            'close': float(row[5]),
            'volume': int(row[6]),
        })

data['data'] = sorted(data['data'], key=lambda x: x['timestamp'])

with open('data/spy.json', 'w') as f:
    json.dump(data, f,  indent=2)
