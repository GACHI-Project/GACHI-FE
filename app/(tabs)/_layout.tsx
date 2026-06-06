import { useEffect } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import TabBar from '../../src/components/common/TabBar';
import colors from '../../src/constants/colors';
import { fetchChildren } from '../../src/api/child';
import { useChildrenStore } from '../../src/store/childrenStore';

const renderTabBar = ({ state, descriptors, navigation, insets }: BottomTabBarProps) => (
  <TabBar state={state} descriptors={descriptors} navigation={navigation} insets={insets} />
);

const TabsLayout = () => {
  const setChildren = useChildrenStore((s) => s.setChildren);

  useEffect(() => {
    fetchChildren()
      .then(setChildren)
      .catch(() => {});
  }, [setChildren]);

  return (
    <View style={styles.root}>
      <Tabs tabBar={renderTabBar} screenOptions={{ headerShown: false }} />
    </View>
  );
};

export default TabsLayout;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.text.white,
  },
});
