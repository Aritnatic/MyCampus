import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { canon, coverage, skillInText } from '../src/skills.js'

describe('skill vocabulary', () => {
  it('normalises case, parentheses and common abbreviations', () => {
    assert.equal(canon('React (learning)'), 'react')
    assert.equal(canon('PCB Design (KiCad)'), 'pcb design')
    assert.equal(canon('JS'), 'javascript')
    assert.equal(canon('C/C++'), 'c++')
  })

  it('knowing a tool covers the skill it implies, but not the reverse', () => {
    assert.deepEqual(coverage(['PostgreSQL'], ['SQL']), [{ required: 'SQL', by: 'PostgreSQL' }])
    assert.deepEqual(coverage(['TensorFlow'], ['Machine Learning', 'Python']).map((c) => c.required), ['Machine Learning', 'Python'])
    assert.deepEqual(coverage(['SQL'], ['PostgreSQL']), [])
    assert.deepEqual(coverage(['Python'], ['Java']), [])
  })

  it('finds a skill (or what it implies) inside a free-text role', () => {
    assert.ok(skillInText('Python', 'Python developer'))
    assert.ok(skillInText('AWS', 'Cloud Expert')) // AWS implies cloud
    assert.ok(skillInText('React', 'Frontend engineer')) // React implies frontend
    assert.equal(skillInText('Java', 'JavaScript developer'), null) // whole words only
    assert.equal(skillInText('C', 'Marketing lead'), null)
  })
})
