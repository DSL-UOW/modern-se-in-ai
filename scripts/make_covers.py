"""Make the category cover images as SVG files.

The three covers use one style: square dots and thin lines on the page
background, grey for structure and blue for the highlight.
  research.svg   layers of nodes, as in a neural network
  industry.svg   people and AI agents that work on one shared task
  community.svg  rings of people around one meeting point

Usage: python3 scripts/make_covers.py   (writes to assets/img/covers/)
"""
import math
import random
from pathlib import Path

W, H = 1600, 900
BG = "#f1f2f4"
GREY = "#b9bcc2"
DARK = "#111111"
BLUE = "#1f6fff"
OUT = Path(__file__).resolve().parent.parent / "assets" / "img" / "covers"


def svg(body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
            f'width="{W}" height="{H}"><rect width="{W}" height="{H}" fill="{BG}"/>'
            + "".join(body) + "</svg>\n")


def dot_grid(rnd, step=40, keep=0.35):
    """Faint background dots, the same texture as the home page hero."""
    out = []
    for y in range(step // 2, H, step):
        for x in range(step // 2, W, step):
            if rnd.random() < keep:
                s = 3 + rnd.random() * 2
                out.append(f'<rect x="{x - s/2:.1f}" y="{y - s/2:.1f}" width="{s:.1f}" height="{s:.1f}" fill="{GREY}" opacity=".45"/>')
    return out


def sq(x, y, s, fill, op=1.0):
    return f'<rect x="{x - s/2:.1f}" y="{y - s/2:.1f}" width="{s:.1f}" height="{s:.1f}" fill="{fill}" opacity="{op}"/>'


def line(x1, y1, x2, y2, col, w=1.5, op=1.0):
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{col}" stroke-width="{w}" opacity="{op}"/>'


def research():
    rnd = random.Random(1)
    body = dot_grid(rnd)
    layers = [4, 7, 9, 7, 3]
    xs = [260 + i * 270 for i in range(len(layers))]
    nodes = []
    for x, n in zip(xs, layers):
        gap = 640 / (n - 1) if n > 1 else 0
        top = H / 2 - gap * (n - 1) / 2
        nodes.append([(x, top + j * gap) for j in range(n)])
    # all links grey, then one blue path through the network
    for a, b in zip(nodes, nodes[1:]):
        for p in a:
            for q in b:
                body.append(line(*p, *q, GREY, 1.2, .55))
    path = [rnd.randrange(len(layer)) for layer in nodes]
    for i in range(len(nodes) - 1):
        body.append(line(*nodes[i][path[i]], *nodes[i + 1][path[i + 1]], BLUE, 4))
    for i, layer in enumerate(nodes):
        for j, (x, y) in enumerate(layer):
            on = j == path[i]
            body.append(sq(x, y, 30 if on else 22, BLUE if on else DARK, 1 if on else .85))
    return svg(body)


def person(x, y, col, s=1.0):
    """A person: round head and a rounded body."""
    return (f'<circle cx="{x:.1f}" cy="{y - 34*s:.1f}" r="{17*s:.1f}" fill="{col}"/>'
            f'<path d="M{x - 30*s:.1f} {y + 34*s:.1f} q0 -48 {30*s:.1f} -48 q{30*s:.1f} 0 {30*s:.1f} 48 z" fill="{col}"/>')


def agent(x, y, col, s=1.0):
    """An AI agent: square head with two eyes and a square body."""
    h = 34 * s
    return (f'<rect x="{x - h/2:.1f}" y="{y - 52*s:.1f}" width="{h:.1f}" height="{h:.1f}" fill="{col}"/>'
            f'<rect x="{x - 8*s:.1f}" y="{y - 40*s:.1f}" width="{5*s:.1f}" height="{5*s:.1f}" fill="{BG}"/>'
            f'<rect x="{x + 3*s:.1f}" y="{y - 40*s:.1f}" width="{5*s:.1f}" height="{5*s:.1f}" fill="{BG}"/>'
            f'<rect x="{x - 26*s:.1f}" y="{y - 10*s:.1f}" width="{52*s:.1f}" height="{44*s:.1f}" fill="{col}"/>')


def industry():
    rnd = random.Random(2)
    body = dot_grid(rnd)
    cx, cy = W / 2, H / 2
    people = [(330, 250), (250, 470), (360, 690)]
    agents = [(1270, 250), (1350, 470), (1240, 690)]
    for x, y in people:
        body.append(line(x + 40, y, cx - 60, cy, GREY, 2))
    for x, y in agents:
        body.append(line(x - 40, y, cx + 60, cy, BLUE, 2))
    # the shared task: a board of cards in the middle
    body.append(f'<rect x="{cx - 130}" y="{cy - 160}" width="260" height="320" fill="#fff" stroke="{DARK}" stroke-width="2"/>')
    for i in range(4):
        y = cy - 120 + i * 72
        col = BLUE if i == 1 else GREY
        body.append(f'<rect x="{cx - 100}" y="{y}" width="200" height="48" fill="{col}" opacity="{1 if i == 1 else .55}"/>')
    for x, y in people:
        body.append(person(x, y, DARK, 1.5))
    for x, y in agents:
        body.append(agent(x, y, BLUE, 1.5))
    return svg(body)


def community():
    rnd = random.Random(3)
    body = dot_grid(rnd)
    cx, cy = W / 2, H / 2 + 10
    # x is stretched so the rings fill the wide frame; y stays inside the frame
    rings = [(150, 8, 1.1), (250, 12, .9), (340, 16, .75)]
    pts = []
    for i, (r, n, s) in enumerate(rings):
        off = i * math.pi / n
        for k in range(n):
            a = off + 2 * math.pi * k / n
            pts.append((cx + r * math.cos(a) * 1.9, cy + r * math.sin(a) * .95, s))
    # ring circles, and spokes from the inner ring only, so no line crosses a figure
    for r, _, _ in rings:
        body.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{r*1.9:.1f}" ry="{r*.95:.1f}" fill="none" stroke="{GREY}" stroke-width="1.2" opacity=".5"/>')
    for x, y, s in pts[:rings[0][1]]:
        body.append(line(x, y, cx, cy, GREY, 1.5, .7))
    blue = set(rnd.sample(range(len(pts)), 9))
    for i, (x, y, s) in enumerate(pts):
        body.append(agent(x, y, BLUE, s) if i in blue else person(x, y, DARK, s))
    body.append(sq(cx, cy, 44, BLUE))
    return svg(body)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in [("research", research), ("industry", industry), ("community", community)]:
        (OUT / f"{name}.svg").write_text(fn())
        print("wrote", OUT / f"{name}.svg")
