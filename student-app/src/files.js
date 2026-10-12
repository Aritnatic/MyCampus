import { fetch as streamFetch } from 'expo/fetch'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'
import { API_URL, ApiError, authHeaders } from './api'

// What the server accepts for note files (see backend/src/routes/notes.js) and its size cap.
export const NOTE_TYPES = [
  'application/pdf', 'image/png', 'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]
export const MAX_NOTE_BYTES = 20 * 1024 * 1024

async function fail(res) {
  const body = await res.json().catch(() => null)
  throw new ApiError(body?.error ?? 'The upload failed.', res.status)
}

// Sends a picked document (from expo-document-picker) as the raw request body.
export async function uploadNoteFile(noteId, asset) {
  if (asset.size && asset.size > MAX_NOTE_BYTES) throw new ApiError('That file is over 20 MB.', 413)
  const type = asset.mimeType
  if (!NOTE_TYPES.includes(type)) throw new ApiError('Choose a PDF, PNG, JPEG, Word or PowerPoint file.', 415)
  const body = Platform.OS === 'web' ? asset.file : new File(asset.uri)
  const res = await streamFetch(`${API_URL}/notes/${noteId}/file`, { method: 'PUT', headers: { ...authHeaders(), 'Content-Type': type }, body })
  if (!res.ok) await fail(res)
  return res.json()
}

// Downloads a note (the endpoint needs the sign-in token, so a plain link won't work) and opens it:
// the share sheet on a phone, a normal browser download on web.
export async function openNoteFile(note) {
  const res = await streamFetch(`${API_URL}/notes/${note.id}/file`, { headers: authHeaders() })
  if (!res.ok) await fail(res)
  const name = `${note.title.replace(/[^\w\- ]+/g, '').trim().slice(0, 60) || 'note'}.${note.fileType}`

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(await res.blob())
    const a = Object.assign(document.createElement('a'), { href: url, download: name })
    a.click()
    URL.revokeObjectURL(url)
    return
  }
  const file = new File(Paths.cache, name)
  if (file.exists) file.delete()
  file.create()
  file.write(await res.bytes())
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: note.contentType, dialogTitle: note.title })
}

// Lets someone keep a copy of their own data: a normal download on web, the share sheet (Save to Files, etc.) on a phone.
export async function saveJson(filename, object) {
  const text = JSON.stringify(object, null, 2)
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    Object.assign(document.createElement('a'), { href: url, download: filename }).click()
    URL.revokeObjectURL(url)
    return
  }
  const file = new File(Paths.cache, filename)
  if (file.exists) file.delete()
  file.create()
  file.write(text)
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Your MyCampus data' })
}
