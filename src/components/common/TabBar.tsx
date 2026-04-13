import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import colors from '../../constants/colors';
import fonts from '../../constants/fonts';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabItem {
  routeName: string;
  label: string;
  icon: IoniconName;
  activeIcon: IoniconName;
}

const TABS: TabItem[] = [
  { routeName: 'index', label: '홈', icon: 'home-outline', activeIcon: 'home' },
  {
    routeName: 'document',
    label: '문서',
    icon: 'document-text-outline',
    activeIcon: 'document-text',
  },
  { routeName: 'scan', label: '스캔', icon: 'scan-outline', activeIcon: 'scan-outline' },
  { routeName: 'calendar', label: '캘린더', icon: 'calendar-outline', activeIcon: 'calendar' },
  { routeName: 'profile', label: '프로필', icon: 'person-outline', activeIcon: 'person' },
];

const TabBar = ({ state, navigation, insets }: BottomTabBarProps) => (
  <View style={[styles.outer, { paddingBottom: insets.bottom }]}>
    <View style={styles.container}>
      {TABS.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.routeName);
        const isActive = !!route && state.index === state.routes.indexOf(route);
        const isScan = tab.routeName === 'scan';

        const onPress = () => {
          if (!route) return;
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented) {
            navigation.navigate(tab.routeName);
          }
        };

        if (isScan) {
          return (
            <TouchableOpacity
              key={tab.routeName}
              style={styles.scanWrapper}
              onPress={onPress}
              activeOpacity={0.85}
            >
              <View style={styles.scanButton}>
                <Svg width={60} height={60} style={StyleSheet.absoluteFill}>
                  <Defs>
                    <RadialGradient id="rg" cx="50%" cy="50%" r="50%">
                      <Stop offset="0.28" stopColor="#47A3FF" stopOpacity="1" />
                      <Stop offset="1" stopColor="#C1ECFC" stopOpacity="1" />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={30} cy={30} r={30} fill="url(#rg)" />
                </Svg>
                <Ionicons name={tab.icon} size={26} color={colors.text.white} />
              </View>
              <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.routeName}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={26}
              color={isActive ? colors.primary[500] : colors.gray[300]}
            />
            <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default TabBar;

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.text.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 12,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 12,
    overflow: 'visible',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  scanWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    marginTop: -26,
  },
  scanButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.primary[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.gray[300],
  },
  activeLabel: {
    color: colors.primary[600],
  },
});
