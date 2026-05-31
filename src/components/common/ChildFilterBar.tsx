import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';
import layout from '../../constants/layout';

interface ChildItem {
  id: number | string;
  name: string;
  colorCode: string;
}

interface ChildFilterBarProps {
  items: ChildItem[];
  selectedChildName: string | undefined;
  onSelect: (name: string | undefined) => void;
}

const ChildFilterBar = ({ items, selectedChildName, onSelect }: ChildFilterBarProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.filterBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterBtn, selectedChildName === undefined && styles.filterBtnSelected]}
          onPress={() => onSelect(undefined)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterText,
              selectedChildName === undefined && styles.filterTextSelected,
            ]}
          >
            {t('common.all')}
          </Text>
        </TouchableOpacity>
        {items.map((child) => {
          const selected = selectedChildName === child.name;
          return (
            <TouchableOpacity
              key={child.id}
              style={[styles.filterBtn, selected && styles.filterBtnSelected]}
              onPress={() => onSelect(child.name)}
              activeOpacity={0.7}
            >
              <View style={[styles.filterDot, { backgroundColor: child.colorCode }]} />
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                {child.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ChildFilterBar;

const styles = StyleSheet.create({
  filterBar: {
    height: 53,
    backgroundColor: colors.text.white,
    justifyContent: 'center',
  },
  filterContent: {
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    gap: 10,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 31,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: 14,
    backgroundColor: colors.text.white,
    gap: 6,
  },
  filterBtnSelected: {
    backgroundColor: colors.primary[500],
    borderWidth: 0,
  },
  filterText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
  },
  filterTextSelected: {
    color: colors.text.white,
  },
  filterDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
  },
});
