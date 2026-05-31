import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

interface MenuItemConfig {
  label: string;
  onPress: () => void;
}

interface HeaderMenuButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  menuItems: MenuItemConfig[];
}

const HeaderMenuButton = ({ icon, menuItems }: HeaderMenuButtonProps) => {
  const [visible, setVisible] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const btnRef = useRef<React.ComponentRef<typeof TouchableOpacity>>(null);

  const handlePress = () => {
    btnRef.current?.measure(
      (_x: number, _y: number, _w: number, height: number, _pageX: number, pageY: number) => {
        setMenuTop(pageY + height - 35);
        setVisible(true);
      }
    );
  };

  return (
    <>
      <TouchableOpacity
        ref={btnRef}
        style={styles.iconButton}
        onPress={handlePress}
        accessibilityRole="button"
      >
        <Ionicons name={icon} size={16} color={colors.gray[300]} />
      </TouchableOpacity>

      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={[styles.menu, { top: menuTop }]} onStartShouldSetResponder={() => true}>
            {menuItems.map((item, index) => (
              <View key={item.label}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setVisible(false);
                    item.onPress();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
                {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default HeaderMenuButton;

const styles = StyleSheet.create({
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    right: layout.screenPaddingHorizontal,
    backgroundColor: colors.text.white,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 160,
  },
  menuItem: {
    height: 40,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.gray[100],
  },
});
