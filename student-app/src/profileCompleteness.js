// What a profile still needs before matching can do anything useful. Shared by Home and Me.
export function missingProfile(user) {
  if (user.role === 'admin') return []
  const gaps = []
  if (!user.skills?.length) gaps.push('skills')
  if (!user.interests?.length) gaps.push('interests')
  if (!user.lookingFor?.length) gaps.push('what you’re looking for')
  if (user.role === 'student' && !(user.bio ?? '').trim()) gaps.push('a short bio')
  return gaps
}
export const profileScore = (user) => Math.round(((4 - missingProfile(user).length) / 4) * 100)
