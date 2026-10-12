import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { shiftDates } from '../src/seed.js'

describe('demo date shifting', () => {
  it('moves dates and datetimes by whole days and leaves everything else alone', () => {
    assert.equal(shiftDates('2024-02-01', 10), '2024-02-11')
    assert.equal(shiftDates('2024-02-28T09:00:00Z', 2), '2024-03-01T09:00:00.000Z')
    assert.equal(shiftDates('2023', 400), '2023') // a year, not a date
    assert.equal(shiftDates('Room 201, Block A', 400), 'Room 201, Block A')
    assert.equal(shiftDates(42, 10), 42)
    assert.deepEqual(shiftDates({ a: ['2024-01-01', { b: '2024-01-02' }], c: 'x' }, 1), { a: ['2024-01-02', { b: '2024-01-03' }], c: 'x' })
  })
})
