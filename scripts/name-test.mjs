// the spoken-name rule as a test: what he'd say for what people type
import { spokenName } from '../src/meet/store.js'
const cases = [['ashhhh', 'Ash'], ['Ashwini', 'Ashwini'], ['sam', 'Sam'], ['SARAH  LEE', 'Sarah'], ['Zoë', 'Zoe'], ['xx', ''], ['assistant', 'Assistant'], ['Hassan', 'Hassan'], ['Cassie', 'Cassie'], ['ass', ''], ['Ross', 'Ross'], ['Jess', 'Jess'], ['bob123', 'Bob'], ['hhhh', ''], ['Priya', 'Priya'], ['mr fuck', ''], ["o'neil", "O'neil"], ['Ashh', 'Ash']]
let bad = 0
for (const [i, want] of cases) { const got = spokenName(i); if (got !== want) bad++; console.log(got === want ? 'ok  ' : 'FAIL', JSON.stringify(i), '→', JSON.stringify(got), got === want ? '' : `(want ${JSON.stringify(want)})`) }
console.log(bad ? `${bad} wrong` : 'all right')
