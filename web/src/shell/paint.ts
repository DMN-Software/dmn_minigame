// gemeinsames handwerkszeug fuer die canvas-spiele. rendering ist frei von der
// simulation, hier darf also auch die uhr benutzt werden.

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rad = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rad, y)
    ctx.lineTo(x + w - rad, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad)
    ctx.lineTo(x + w, y + h - rad)
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h)
    ctx.lineTo(x + rad, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad)
    ctx.lineTo(x, y + rad)
    ctx.quadraticCurveTo(x, y, x + rad, y)
    ctx.closePath()
}

export function fillRound(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
    roundRect(ctx, x, y, w, h, r)
    ctx.fillStyle = fill
    ctx.fill()
}

// leuchten kostet in cef spuerbar, deshalb nur um die wenigen elemente legen,
// auf die es ankommt, und danach wieder abschalten
export function glow(ctx: CanvasRenderingContext2D, color: string, blur: number, draw: () => void) {
    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur = blur
    draw()
    ctx.restore()
}

export function verticalFade(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    h: number,
    top: string,
    bottom: string,
): CanvasGradient {
    const g = ctx.createLinearGradient(x, y, x, y + h)
    g.addColorStop(0, top)
    g.addColorStop(1, bottom)
    return g
}

// hintergrund fuer jedes canvas-spiel: dunkler verlauf plus feines raster,
// damit die flaeche nicht als schwarzes loch wirkt
export function backdrop(ctx: CanvasRenderingContext2D, w: number, h: number, grid = 30) {
    ctx.fillStyle = verticalFade(ctx, 0, 0, h, '#121722', '#0a0d13')
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(255, 255, 255, .028)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = grid; x < w; x += grid) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
    }
    for (let y = grid; y < h; y += grid) {
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
    }
    ctx.stroke()
}

export function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size = 15, color = '#8b97a6') {
    ctx.fillStyle = color
    ctx.font = `600 ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`
    ctx.textBaseline = 'top'
    ctx.fillText(text, x, y)
}
