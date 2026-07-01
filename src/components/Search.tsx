import {
  Calendar,
  ChevronRight,
  FileText,
  FolderOpen,
  Search as SearchIcon,
  SearchX,
  X,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import React, { useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createStyleSheet } from 'react-native-unistyles';
import { getSearch } from '../api/functions/common.api';
import { CoachAi, HeaderSearchIcon } from '../assets';
import { useDebounce } from '../hooks/useDebounce';
import { theme } from '../theme';
import { AppStackParamList } from '../types/navigation';
import { fontSize, scale, spacing } from '../utils';
import CoachAiSheet from './CoachAi';
import TouchableButton from './TouchableButton';
import { Skeleton } from './ui/Skeleton';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'task', label: 'Tasks' },
  { key: 'document', label: 'Documents' },
] as const;

const renderTypeIcon = (type: string) => {
  const iconProps = { size: fontSize(18), color: theme.colors.primary };
  switch (type) {
    case 'document':
      return <FolderOpen {...iconProps} />;
    default:
      return <FileText {...iconProps} />;
  }
};

const SearchResultsSkeleton = () => (
  <View style={styles.skeletonWrap}>
    {[0, 1, 2, 3, 4].map(i => (
      <View key={i} style={styles.searchItem}>
        <Skeleton width={scale(44)} height={scale(44)} borderRadius={12} />
        <View style={styles.skeletonBody}>
          <Skeleton width="70%" height={14} borderRadius={5} />
          <Skeleton width="40%" height={12} borderRadius={5} />
        </View>
      </View>
    ))}
  </View>
);

type SearchNavigationProp = NativeStackNavigationProp<AppStackParamList>;

export default function Search() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SearchNavigationProp>();
  const [searchModal, setSearchModal] = useState(false);
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState<string>('all');
  const inputRef = useRef<TextInput>(null);

  const debouncedSearch = useDebounce(query, 300);

  const {
    data = [],
    refetch,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['search', category, debouncedSearch],
    queryFn: ({ signal }) => getSearch(debouncedSearch, category, signal),
    staleTime: 60 * 1000,
  });

  const results = data.filter(_data => _data.type !== 'transcript');
  const isRefreshing = !!data && isFetching && !isLoading;
  const hasQuery = !!debouncedSearch.trim();

  const closeModal = () => setSearchModal(false);

  const onItemPress = (type: string, id: string) => {
    if (type === 'task') {
      navigation.navigate('TaskDetails', { taskId: id });
    } else {
      navigation.navigate('DocumentEditor', { documentId: id });
    }
    closeModal();
  };

  return (
    <View style={styles.searchContainer}>
      <TouchableButton
        style={styles.searchBox}
        onPress={() => setSearchModal(true)}
      >
        <HeaderSearchIcon />
        <Text style={styles.searchInput}>Search</Text>
      </TouchableButton>
      <CoachAiSheet page="general">
        <CoachAi />
      </CoachAiSheet>

      <Modal
        visible={searchModal}
        onRequestClose={closeModal}
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onShow={() => {
          // Force dark status-bar icons for the light modal (Android only).
          if (Platform.OS === 'android') {
            StatusBar.setBarStyle('dark-content');
          }
          // autoFocus marks the input focused without raising the keyboard, so
          // focus explicitly once the open animation has finished.
          setTimeout(
            () => inputRef.current?.focus(),
            Platform.OS === 'android' ? 150 : 50,
          );
        }}
      >
        {searchModal && Platform.OS === 'android' && (
          <StatusBar
            barStyle="dark-content"
            backgroundColor="transparent"
            translucent
          />
        )}
        <View
          style={[
            styles.modalRoot,
            {
              // The modal is statusBarTranslucent (and edge-to-edge is enforced
              // on Android 15+), so it draws under the status bar / notch.
              // insets.top is unreliable inside a RN Modal on Android, so fall
              // back to the status bar height. The white background fills the
              // reserved strip so the status bar icons stay readable.
              paddingTop:
                Platform.OS === 'ios'
                  ? insets.top
                  : Math.max(insets.top, StatusBar.currentHeight ?? 0),
            },
          ]}
        >
          <View style={styles.searchHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.heading}>Search</Text>
              <Pressable
                onPress={closeModal}
                hitSlop={spacing(10)}
                style={styles.closeBtn}
              >
                <X size={fontSize(20)} color={theme.colors.gray[700]} />
              </Pressable>
            </View>

            <View style={styles.searchField}>
              <SearchIcon size={fontSize(18)} color={theme.colors.gray[400]} />
              <TextInput
                ref={inputRef}
                placeholder="Search tasks and documents..."
                style={styles.searchFieldInput}
                placeholderTextColor={theme.colors.gray[400]}
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable
                  onPress={() => setQuery('')}
                  hitSlop={spacing(10)}
                  style={styles.clearBtn}
                >
                  <X size={fontSize(15)} color={theme.colors.gray[500]} />
                </Pressable>
              )}
            </View>

            <View style={styles.chipsRow}>
              {CATEGORIES.map(chip => {
                const active = category === chip.key;
                return (
                  <TouchableButton
                    key={chip.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setCategory(chip.key)}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableButton>
                );
              })}
            </View>
          </View>

          {isLoading ? (
            <View style={styles.listBg}>
              <SearchResultsSkeleton />
            </View>
          ) : (
            <KeyboardAwareFlatList
              data={results}
              contentContainerStyle={[
                styles.searchContentContainer,
                results.length === 0 && styles.searchContentEmpty,
                { paddingBottom: insets.bottom + spacing(20) },
              ]}
              refreshing={isRefreshing}
              onRefresh={refetch}
              style={styles.listBg}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListHeaderComponent={
                results.length > 0 ? (
                  <Text style={styles.resultCount}>
                    {results.length} result{results.length === 1 ? '' : 's'}
                  </Text>
                ) : null
              }
              renderItem={({ item }) => (
                <TouchableButton
                  style={styles.searchItem}
                  onPress={() => onItemPress(item.type, item._id)}
                >
                  <View style={styles.iconTile}>
                    {renderTypeIcon(item.type)}
                  </View>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.metaRow}>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{item.type}</Text>
                      </View>
                      <View style={styles.metaDot} />
                      <Calendar
                        size={fontSize(12)}
                        color={theme.colors.gray[500]}
                      />
                      <Text style={styles.metaText}>
                        {moment(item.createdAt).format('ll')}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight
                    size={fontSize(18)}
                    color={theme.colors.gray[300]}
                  />
                </TouchableButton>
              )}
              keyExtractor={item => item._id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                isFetching ? null : (
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                      {hasQuery ? (
                        <SearchX
                          size={fontSize(26)}
                          color={theme.colors.gray[400]}
                        />
                      ) : (
                        <SearchIcon
                          size={fontSize(26)}
                          color={theme.colors.gray[400]}
                        />
                      )}
                    </View>
                    <Text style={styles.emptyTitle}>
                      {hasQuery ? 'No results found' : 'Search everything'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {hasQuery
                        ? `We couldn't find anything for “${debouncedSearch.trim()}”`
                        : 'Find your tasks and documents by title'}
                    </Text>
                  </View>
                )
              }
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = createStyleSheet({
  searchContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: fontSize(36),
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(10),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    paddingHorizontal: spacing(12),
    shadowColor: theme.colors.gray[500],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize(14),
    marginLeft: spacing(8),
    color: theme.colors.gray[400],
    fontFamily: theme.fonts.lato.regular,
  },

  // Modal
  modalRoot: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  searchHeader: {
    paddingHorizontal: spacing(20),
    paddingTop: spacing(14),
    paddingBottom: spacing(14),
    backgroundColor: theme.colors.white,
    gap: spacing(14),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: fontSize(22),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[950],
  },
  closeBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gray[100],
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
    height: scale(46),
    paddingHorizontal: spacing(14),
    borderRadius: fontSize(14),
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  searchFieldInput: {
    flex: 1,
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(15),
    color: theme.colors.gray[900],
    padding: 0,
  },
  clearBtn: {
    width: scale(20),
    height: scale(20),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gray[200],
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing(8),
  },
  chip: {
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(8),
    borderRadius: 999,
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(13),
    color: theme.colors.gray[600],
  },
  chipTextActive: {
    color: theme.colors.white,
  },

  // List
  listBg: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  searchContentContainer: {
    padding: spacing(16),
    paddingTop: spacing(14),
    gap: spacing(10),
  },
  searchContentEmpty: {
    flexGrow: 1,
  },
  resultCount: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(12),
    color: theme.colors.gray[500],
    marginBottom: spacing(4),
    marginLeft: spacing(2),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skeletonWrap: {
    padding: spacing(16),
    paddingTop: spacing(14),
    gap: spacing(10),
  },
  skeletonBody: {
    flex: 1,
    gap: spacing(8),
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: fontSize(14),
    backgroundColor: theme.colors.white,
    padding: spacing(12),
    shadowColor: theme.colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconTile: {
    width: scale(44),
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(14,23,52,0.06)',
  },
  itemBody: {
    flex: 1,
    gap: spacing(6),
  },
  itemTitle: {
    color: theme.colors.gray[900],
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(14),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
  },
  typeBadge: {
    paddingHorizontal: spacing(8),
    paddingVertical: Platform.OS === 'ios' ? spacing(3) : spacing(1),
    backgroundColor: theme.colors.gray[100],
    borderRadius: 999,
  },
  typeBadgeText: {
    color: theme.colors.gray[600],
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(11),
    textTransform: 'capitalize',
  },
  metaDot: {
    width: scale(3),
    height: scale(3),
    borderRadius: 999,
    backgroundColor: theme.colors.gray[300],
  },
  metaText: {
    color: theme.colors.gray[500],
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(12),
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(40),
    paddingBottom: spacing(60),
  },
  emptyIconCircle: {
    width: scale(72),
    height: scale(72),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gray[100],
    marginBottom: spacing(16),
  },
  emptyTitle: {
    color: theme.colors.gray[800],
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(16),
    marginBottom: spacing(6),
    textAlign: 'center',
  },
  emptySubtitle: {
    color: theme.colors.gray[500],
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    textAlign: 'center',
    lineHeight: fontSize(19),
  },
});
