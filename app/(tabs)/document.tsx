import { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import colors from '../../src/constants/colors';
import fonts from '../../src/constants/fonts';
import layout from '../../src/constants/layout';
import { MOCK_DOCUMENTS, MOCK_CHILDREN } from '../../src/mock/documents';
import DocumentCard from '../../src/components/document/DocumentCard';
import Header from '../../src/components/common/Header';

const DocumentScreen = () => {
  const { t } = useTranslation();
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = MOCK_DOCUMENTS.filter((doc) => {
    const matchChild = selectedChildId === 'all' || doc.childId === selectedChildId;
    const matchSearch = doc.title.includes(searchQuery.trim());
    return matchChild && matchSearch;
  });

  return (
    <View style={styles.container}>
      <Header title={t('document.title')} />
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={25} color={colors.gray[200]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('document.searchPlaceholder')}
          placeholderTextColor={colors.gray[200]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterBtn, selectedChildId === 'all' && styles.filterBtnSelected]}
          onPress={() => setSelectedChildId('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, selectedChildId === 'all' && styles.filterTextSelected]}>
            {t('common.all')}
          </Text>
        </TouchableOpacity>

        {MOCK_CHILDREN.map((child) => {
          const selected = selectedChildId === child.id;
          return (
            <TouchableOpacity
              key={child.id}
              style={[styles.filterBtn, selected && styles.filterBtnSelected]}
              onPress={() => setSelectedChildId(child.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.childDot, { backgroundColor: child.calendarColor }]} />
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                {child.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>{t('document.empty')}</Text>
        ) : (
          filtered.map((doc) => <DocumentCard key={doc.id} item={doc} onPress={() => {}} />)
        )}
      </ScrollView>
    </View>
  );
};

export default DocumentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: colors.text.white,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 14,
    paddingTop: 4,
    paddingBottom: 34,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: layout.screenPaddingHorizontal,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text.primary,
    padding: 0,
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  list: {
    flex: 1,
  },
  filterContent: {
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: 16,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.text.white,
    gap: 6,
  },
  filterBtnSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  filterText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text.secondary,
  },
  filterTextSelected: {
    color: colors.text.white,
  },
  childDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.gray[300],
  },
});
