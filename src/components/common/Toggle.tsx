import { TouchableOpacity, View, StyleSheet } from 'react-native';
import colors from '../../constants/colors';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const Toggle = ({ value, onValueChange, disabled = false }: ToggleProps) => (
  <TouchableOpacity
    style={[
      styles.track,
      value ? styles.trackOn : styles.trackOff,
      disabled && styles.trackDisabled,
    ]}
    onPress={() => !disabled && onValueChange(!value)}
    activeOpacity={0.8}
  >
    <View style={styles.thumb} />
  </TouchableOpacity>
);

export default Toggle;

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: '#2F8CFF',
    alignItems: 'flex-end',
    paddingRight: 3,
  },
  trackOff: {
    backgroundColor: colors.gray[200],
    alignItems: 'flex-start',
    paddingLeft: 3,
  },
  trackDisabled: {
    opacity: 0.4,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEFEFE',
  },
});
