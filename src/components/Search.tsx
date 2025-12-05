import Lucide from '@react-native-vector-icons/lucide';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { createStyleSheet } from 'react-native-unistyles';
import { getSearch } from '../api/functions/common.api';
import { CoachAi, HeaderSearchIcon } from '../assets';
import { useDebounce } from '../hooks/useDebounce';
import { theme } from '../theme';
import { AppStackParamList } from '../types/navigation';
import { fontSize, scale, spacing } from '../utils';
import TouchableButton from './TouchableButton';
import CoachAiSheet from './CoachAi';

const renderSearchIcons = (type: string) => {
  switch (type) {
    case 'task':
      return 'file-text';
    case 'document':
      return 'folder-open';
    default:
      return 'file-text';
  }
};

type SearchNavigationProp = NativeStackNavigationProp<AppStackParamList>;

export default function Search() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SearchNavigationProp>();
  const [searchModal, setSearchModal] = useState(false);
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('all');

  const debouncedSearch = useDebounce(query, 300);

  const {
    data = [],
    refetch,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['search', category, debouncedSearch],
    queryFn: () => getSearch(debouncedSearch, category),
    staleTime: 60 * 1000,
  });

  const isRefreshing = !!data && isFetching && !isLoading;

  const onItemPress = (type: string, id: string) => {
    if (type === 'task') {
      navigation.navigate('TaskDetails', { taskId: id });
    } else {
      navigation.navigate('DocumentEditor', { documentId: id });
    }
    setSearchModal(false);
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
      {/* <TouchableButton activeOpacity={0.8}>
        <CoachAi />
      </TouchableButton> */}
      <Modal
        visible={searchModal}
        onRequestClose={() => setSearchModal(false)}
        animationType="slide"
      >
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <View style={styles.searchHeader}>
            <Text style={styles.heading}>Search</Text>
            <View style={styles.searchRow}>
              <TextInput
                placeholder="Search..."
                style={styles.searchHeaderInput}
                placeholderTextColor={theme.colors.gray[500]}
                value={query}
                onChangeText={val => setQuery(val)}
                autoFocus
              />
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setSearchModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
            <View style={styles.searchRow}>
              <TouchableButton
                style={[
                  styles.badge,
                  {
                    paddingHorizontal: spacing(15),
                    paddingVertical: spacing(6),
                  },
                  category === 'all' && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => setCategory('all')}
              >
                <Text
                  style={[
                    styles.badgeText,
                    category === 'all' && { color: theme.colors.white },
                  ]}
                >
                  All
                </Text>
              </TouchableButton>
              <TouchableButton
                style={[
                  styles.badge,
                  {
                    paddingHorizontal: spacing(15),
                    paddingVertical: spacing(6),
                  },
                  category === 'task' && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => setCategory('task')}
              >
                <Text
                  style={[
                    styles.badgeText,
                    category === 'task' && { color: theme.colors.white },
                  ]}
                >
                  Task
                </Text>
              </TouchableButton>
              <TouchableButton
                style={[
                  styles.badge,
                  {
                    paddingHorizontal: spacing(15),
                    paddingVertical: spacing(6),
                  },
                  category === 'document' && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => setCategory('document')}
              >
                <Text
                  style={[
                    styles.badgeText,
                    category === 'document' && { color: theme.colors.white },
                  ]}
                >
                  Document
                </Text>
              </TouchableButton>
            </View>
          </View>
          {isLoading ? (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <KeyboardAwareFlatList
              data={data.filter(_data => _data.type !== 'transcript')}
              contentContainerStyle={[
                styles.searchContentContainer,
                { paddingBottom: insets.bottom },
              ]}
              refreshing={isRefreshing}
              onRefresh={refetch}
              style={{
                backgroundColor: theme.colors.gray[50],
                flex: 1,
              }}
              renderItem={({ item }) => (
                <TouchableButton
                  style={styles.searchItem}
                  onPress={() => onItemPress(item.type, item._id)}
                >
                  <View style={styles.icon}>
                    <Lucide
                      name={renderSearchIcons(item.type)}
                      size={fontSize(18)}
                    />
                  </View>
                  <View style={styles.itemContainer}>
                    <Text style={styles.itemText}>{item.title}</Text>
                    <View style={styles.lowerContainer}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.type}</Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing(4),
                        }}
                      >
                        <Lucide
                          name="calendar"
                          size={fontSize(12)}
                          color={theme.colors.gray[600]}
                        />
                        <Text style={styles.calendarText}>
                          {moment(item.createdAt).format('ll')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableButton>
              )}
              keyExtractor={item => item._id}
              showsVerticalScrollIndicator={false}
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
    // paddingVertical: spacing(6),
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
  heading: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[950],
    textAlign: 'center',
  },
  searchContentContainer: {
    padding: spacing(20),
    paddingHorizontal: spacing(20),
    paddingTop: spacing(15),
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  searchHeader: {
    paddingHorizontal: spacing(20),
    paddingVertical: spacing(20),
    backgroundColor: '#fff',
    paddingBottom: spacing(10),
    gap: spacing(15),
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing(10),
    alignItems: 'center',
  },
  searchHeaderInput: {
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: 10,
    paddingHorizontal: Platform.OS === 'ios' ? spacing(15) : spacing(15),
    paddingVertical: Platform.OS === 'ios' ? spacing(12) : spacing(10),
    flex: 1,
  },
  cancelBtn: {
    padding: spacing(5),
  },
  cancelText: {},
  searchItem: {
    flexDirection: 'row',
    gap: spacing(10),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: 10,
    backgroundColor: theme.colors.white,
    padding: spacing(10),
    marginBottom: spacing(10),
  },
  icon: {
    backgroundColor: theme.colors.gray[200],
    width: scale(45),
    height: scale(45),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  itemContainer: {
    gap: Platform.OS === 'ios' ? spacing(8) : spacing(4),
  },
  itemText: {
    color: theme.colors.gray[700],
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(14),
    marginTop: spacing(2),
  },
  lowerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
  },
  badge: {
    paddingHorizontal: spacing(8),
    paddingVertical: Platform.OS === 'ios' ? spacing(4) : spacing(1),
    backgroundColor: theme.colors.gray[200],
    borderRadius: 100,
  },
  badgeText: {
    color: theme.colors.gray[700],
    fontFamily: theme.fonts.archivo.medium,
    fontSize: Platform.OS === 'ios' ? fontSize(12) : fontSize(10),
    textTransform: 'capitalize',
  },
  calendarText: {
    color: theme.colors.gray[600],
    verticalAlign: 'middle',
    fontSize: Platform.OS === 'ios' ? fontSize(14) : fontSize(12),
  },
});
