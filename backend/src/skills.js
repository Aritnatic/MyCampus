// Skill vocabulary shared by matching and career guidance. Skills are free text on profiles
// ("PCB Design (KiCad)", "React (learning)"), so comparisons go through `canon`, and a skill
// can also *imply* broader ones (knowing PostgreSQL means you know SQL).

export const norm = (s) => String(s).toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9+#./\s]/g, '').replace(/\s+/g, ' ').trim()

const ALIAS = {
  js: 'javascript', ts: 'typescript', nodejs: 'node.js', 'node js': 'node.js', reactjs: 'react', 'react.js': 'react', postgres: 'postgresql',
  golang: 'go', 'c/c++': 'c++', ml: 'machine learning', dl: 'deep learning', ai: 'artificial intelligence', dsa: 'data structures',
  k8s: 'kubernetes', 'rest api': 'rest apis', restapi: 'rest apis', 'restful apis': 'rest apis', cv: 'computer vision', nlp: 'natural language processing',
}
export const canon = (s) => { const n = norm(s); return ALIAS[n] ?? n }

const IMPLIES = {
  postgresql: ['sql', 'databases'], mysql: ['sql', 'databases'], sqlite: ['sql', 'databases'], sql: ['databases'], mongodb: ['nosql', 'databases'],
  react: ['javascript', 'frontend', 'web'], 'react native': ['react', 'javascript', 'mobile'], vue: ['javascript', 'frontend'], angular: ['javascript', 'frontend'],
  typescript: ['javascript'], 'node.js': ['javascript', 'rest apis', 'backend'], express: ['node.js', 'rest apis', 'backend'],
  django: ['python', 'rest apis', 'backend'], flask: ['python', 'rest apis', 'backend'], fastapi: ['python', 'rest apis', 'backend'],
  tensorflow: ['machine learning', 'deep learning', 'python'], pytorch: ['machine learning', 'deep learning', 'python'],
  'scikit-learn': ['machine learning', 'python'], pandas: ['python', 'data analysis'], numpy: ['python'], opencv: ['computer vision', 'python'],
  docker: ['devops'], kubernetes: ['docker', 'devops'], aws: ['cloud'], gcp: ['cloud'], azure: ['cloud'], git: ['version control'],
  arduino: ['microcontrollers', 'embedded'], esp32: ['microcontrollers', 'arduino', 'embedded', 'iot'], 'raspberry pi': ['linux', 'embedded'],
  freertos: ['rtos', 'embedded'], kicad: ['pcb design'], altium: ['pcb design'], 'pcb design': ['electronics'],
  solidworks: ['cad'], autocad: ['cad'], 'staad.pro': ['structural analysis'], etabs: ['structural analysis'], simulink: ['matlab'],
  'data structures': ['algorithms'], algorithms: ['data structures'], 'machine learning': ['python'], 'deep learning': ['machine learning'],
}

// Everything knowing `skill` lets you claim: itself plus what it implies.
const claims = (skill) => { const c = canon(skill); return [c, ...(IMPLIES[c] ?? [])] }

// Does the free-text `text` (a role title, a "looking for" phrase) mention this skill, or something it implies?
const hasPhrase = (text, phrase) => new RegExp(`(^|[^a-z0-9+#])${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9+#])`).test(text)
export function skillInText(skill, text) {
  const t = norm(text)
  return claims(skill).find((c) => c.length >= 2 && hasPhrase(t, c)) ? skill : null
}

// Which of the `required` skills does this person cover, and through which of theirs?
// → [{ required: 'SQL', by: 'PostgreSQL' }]
export function coverage(mine, required = []) {
  const out = []
  for (const req of required) {
    const want = canon(req)
    const by = mine.find((s) => claims(s).includes(want))
    if (by) out.push({ required: req, by })
  }
  return out
}
