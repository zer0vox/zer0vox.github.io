// The path's sketches, one per step, drawn in the page's two hands: the
// marker (bold, yellow -- the "ghb" monogram's nib) for the shapes, and the
// pen (fine, white -- the signature's line) for hatching, ruling and sparkle.
//
// Every sketch shares one 240 x 180 sheet, so they sit at the same scale.
// Strokes are listed in the order a hand would draw them; each is written on
// in turn (HuePath), and a path's subpaths (its M moves) are drawn one after
// another, so an outline can overshoot its corners the way a quick drawing
// does.
//
// type: 'm' marker, 'p' pen.

export const SKETCH_VIEWBOX = '0 0 240 180'

export const SKETCHES = {
  // The DAAI Award of Excellence: a medal on a crossed ribbon.
  medal: [
    ['m', 'M84 10L105 7L129 79L111 85L83 13'],
    ['m', 'M156 10L135 7L111 79L129 85L157 13'],
    ['m', 'M150 100C164 120 156 152 124 156C92 160 76 136 84 110C92 86 124 80 146 94C152 98 156 104 158 110'],
    ['m', 'M120 106L124 116L135 117L127 124L130 135L120 129L110 135L113 124L105 117L116 116Z'],
    ['p', 'M120 93C138 93 148 105 148 121C148 139 134 148 118 148C102 148 92 136 92 120C92 105 104 93 123 94'],
    ['p', 'M92 22L100 21M95 34L103 33M99 46L107 45M144 22L150 21M139 34L147 33M135 46L142 45'],
    ['p', 'M190 52V70M181 61H199M52 118V132M45 125H59M198 118V128M193 123H203'],
  ],

  // The Nepal Engineering Council registration: a certificate and its seal.
  certificate: [
    ['m', 'M34 30L204 24M201 21L206 150M209 147L38 154M41 157L34 27'],
    ['m', 'M70 52C90 48 130 47 170 48'],
    ['p', 'M60 72L180 70M60 86L172 85M60 100L150 99'],
    ['p', 'M58 130C64 118 72 136 78 124C82 116 88 134 96 126C100 122 106 128 116 127'],
    ['m', 'M187 122C187 133 179 142 168 141C157 140 151 131 153 120C155 110 165 104 175 107C183 110 188 117 186 126'],
    ['m', 'M160 138L154 164L162 158L167 166L172 141'],
    ['p', 'M162 123L168 129L178 115'],
  ],

  // The degree: a mortarboard, its tassel swinging off the button.
  cap: [
    ['m', 'M118 27L213 59L121 93L27 61L120 28'],
    ['m', 'M66 78V116C88 134 152 134 174 116V78'],
    ['m', 'M124 61C124 64 121 66 119 65C116 64 116 60 119 59C121 58 124 59 124 62'],
    ['m', 'M121 61C150 62 178 64 196 68V116M190 115H202'],
    ['m', 'M191 117L187 142M196 117V145M201 117L205 142'],
    ['p', 'M60 58L120 37M72 100L82 90M72 112L94 90M80 121L104 97'],
  ],

  // CNAD: a radio mast on the air, and a paper plane picking it up.
  tower: [
    ['m', 'M120 44L94 166M120 44L146 166M78 167L162 165'],
    ['m', 'M125 38C125 41 122 43 120 43C117 43 115 41 115 38C115 35 117 33 120 33C123 33 125 35 125 39'],
    ['m', 'M100 26C92 34 92 46 100 54M140 26C148 34 148 46 140 54'],
    ['m', 'M88 16C74 30 74 52 88 64M152 16C166 30 166 52 152 64'],
    ['p', 'M114 72H126M108 98H132M101 126H139M97 148H143'],
    ['p', 'M114 72L132 98M126 72L108 98M108 98L139 126M132 98L101 126'],
    ['m', 'M174 52L220 30L198 66L190 54Z'],
    ['p', 'M190 54L220 30M152 100L157 95M162 90L167 85M172 80L176 76'],
  ],

  // MandaapX, now: "currently brewing" -- a mug with the steam coming off it,
  // the code written on its side in pen.
  brew: [
    ['m', 'M66 67C65 58 159 57 158 66C157 75 68 76 64 66'],
    ['m', 'M66 68L74 144C76 156 148 156 150 144L158 68'],
    ['m', 'M157 84C186 80 194 124 153 128'],
    ['m', 'M44 160C86 170 140 170 184 158'],
    ['p', 'M96 98L84 110L96 122M116 94L106 126M126 98L138 110L126 122'],
    ['p', 'M92 50C84 40 100 32 92 20M112 48C104 36 122 28 112 14M132 50C124 40 140 32 132 20'],
    ['p', 'M190 50V64M183 57H197'],
  ],

  // The next one: the open page, ruled and blank, and the pencil on it.
  pencil: [
    ['p', 'M30 40H110M30 56H96M30 72H104'],
    ['m', 'M69 128L190 33M81 142L202 47M190 33C196 30 204 38 202 47'],
    ['m', 'M69 128L56 150L81 142'],
    ['p', 'M175 45L186 60M168 50L180 64M60 143L56 150L63 148'],
    ['m', 'M52 156C42 168 30 150 22 162C16 172 32 176 38 166'],
    ['p', 'M150 116V130M143 123H157'],
  ],
}
