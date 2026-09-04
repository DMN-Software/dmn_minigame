import { NAME_MAX, NAME_MIN, NAME_RE, normalizeName } from '../../shared/scores.ts'

const LEET: Record<string, string> = {
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's',
}

// anstandspruefung, keine moderation. was durchrutscht, raeumt DELETE /scores/:id weg.
const BLOCKED = [
    'arschloch', 'fick', 'fotze', 'hure', 'missgeburt', 'nutte', 'scheis', 'schlampe', 'wichs',
    'asshole', 'bitch', 'cunt', 'fuck', 'nigga', 'nigger', 'shit', 'whore',
    'hitler', 'nazi', 'siegheil', 'hakenkreuz',
]

// leetspeak zurueckdrehen und alles ausser buchstaben werfen, damit "H1tl3r" und "f u c k" haengen bleiben
function flatten(name: string): string {
    return name
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[013457@$]/g, (c) => LEET[c])
        .replace(/ß/g, 'ss')
        .replace(/[^a-z]/g, '')
}

// hangul-fueller zaehlen als \p{L}, rendern aber als leerraum - damit liesse sich die
// liste mit optisch identischen leerzeilen zumuellen
const BLANKS = /[ᅟᅠㅤﾠ]/

export type NameCheck = { ok: true; name: string } | { ok: false; message: string }

export function checkName(raw: string): NameCheck {
    const name = normalizeName(raw)
    if (name.length < NAME_MIN) return { ok: false, message: 'Name zu kurz' }
    if (name.length > NAME_MAX) return { ok: false, message: 'Name zu lang' }
    if (!NAME_RE.test(name)) return { ok: false, message: 'Name enthält unerlaubte Zeichen' }
    if (BLANKS.test(name)) return { ok: false, message: 'Name enthält unerlaubte Zeichen' }

    const flat = flatten(name)
    if (BLOCKED.some((word) => flat.includes(word))) return { ok: false, message: 'Name nicht erlaubt' }

    return { ok: true, name }
}
