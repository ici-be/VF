#!/usr/bin/env python3
"""Full-size frames of chimie ch01 for review.
    uv run --with playwright --with pillow python tools/chimie/frames.py OUT beat@t [beat@t ...]
beat is a beat id; t is seconds on the beat clock, or a mark name from timings (e.g. g+1.0). Chromium."""
import asyncio, json, re, sys
from pathlib import Path
from playwright.async_api import async_playwright

URL = 'http://localhost:8765/chimie/ch01/'
async def main(out, specs):
    out = Path(out); out.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1640, 'height': 1000})
        msgs = []
        pg.on('console', lambda m: msgs.append(m.text) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: msgs.append('PAGEERROR ' + str(e)))
        for spec in specs:
            beat, t = spec.split('@')
            await pg.goto(URL)
            idx = None
            await pg.wait_for_function('typeof BEATS !== "undefined"')
            idx = await pg.evaluate("id => BEATS.findIndex(b => b.id === id)", beat)
            marks = await pg.evaluate("id => TIMINGS[id].marks", beat)
            m = re.match(r'^([a-z0-9]+)([+-][0-9.]+)?$', t)
            if m and m.group(1) in marks: tt = marks[m.group(1)] + float(m.group(2) or 0)
            elif t == 'end': tt = (await pg.evaluate("id => TIMINGS[id].dur", beat)) - .05
            else: tt = float(t)
            await pg.goto(f'{URL}?beat={idx}&t={tt}')
            await pg.wait_for_timeout(900)
            await pg.screenshot(path=str(out / f'{beat}_{t}.png'))
            print('ok', beat, round(tt, 2))
        for m in msgs: print('console:', m)
        await b.close()
asyncio.run(main(sys.argv[1], sys.argv[2:]))
