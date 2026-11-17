"""Compare complete Python and browser-JS output for every supported integer control combination."""
import json
from pathlib import Path
import subprocess
from app import optimize
ROOT=Path(__file__).resolve().parent
cases=[(service,count,minutes) for service in ('health','food','vaccine') for count in range(1,11) for minutes in range(5,46)]
script='''const fs=require('fs');const {optimize,roundEven}=require('./optimizer.js');const data=JSON.parse(fs.readFileSync('data.json','utf8'));const cases=JSON.parse(fs.readFileSync(0,'utf8'));for(const x of [0.5,1.5,2.5,3.5,-0.5,-1.5,-2.5]){if(roundEven(x)!==([0,2,2,4,0,-2,-2][[0.5,1.5,2.5,3.5,-0.5,-1.5,-2.5].indexOf(x)]))throw Error('rounding '+x);}for(const args of [['invalid',5,15],['health',0,15],['health',5,46],['health',1.5,15]]){let rejected=false;try{optimize(data,...args)}catch(e){rejected=true}if(!rejected)throw Error('accepted invalid '+args);}console.log(JSON.stringify(cases.map(c=>optimize(data,...c))));'''
actual=json.loads(subprocess.run(['node','-e',script],input=json.dumps(cases),text=True,capture_output=True,cwd=ROOT,check=True).stdout)
for case,result in zip(cases,actual):
    expected=optimize(*case)
    assert result==expected, f'Python/JS mismatch {case}'
assert len(actual)==len(cases)
print(f'PASS: {len(cases)} full-output parity cases (3 services × 10 stop counts × 41 travel windows), ties-to-even rounding, invalid JS inputs')
