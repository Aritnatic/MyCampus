import Svg, { Path } from 'react-native-svg'

// The MyCampus mark (brand/mark.svg): a lowercase "m" of two arches, the right one a step higher.
export function BrandMark({ size = 28, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" accessibilityLabel="MyCampus">
      <Path d="M22 87V61a13 13 0 0 1 26 0M48 87V40a13 13 0 0 1 26 0V87" transform="translate(0 -5.5)" fill="none" stroke={color} strokeWidth={14} strokeLinecap="butt" />
    </Svg>
  )
}
