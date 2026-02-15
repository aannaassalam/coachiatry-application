import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import moment from 'moment';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';
import {
  deleteDocument,
  getAllDocuments,
  getDocument,
} from '../../api/functions/document.api';
import { Calendar } from '../../assets';
import TouchableButton from '../../components/TouchableButton';
import AppBadge from '../../components/ui/AppBadge';
import AppHeader from '../../components/ui/AppHeader';
import AppTabs from '../../components/ui/AppTabs';
import { hapticOptions } from '../../helpers/utils';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { PaginatedResponse } from '../../typescript/interface/common.interface';
import { Document } from '../../typescript/interface/document.interface';
import { fontSize, scale, spacing } from '../../utils';
import { useAuth } from '../../hooks/useAuth';
import { Pencil } from 'lucide-react-native';
import {
  getAllCategories,
  getAllCategoriesByCoach,
} from '../../api/functions/category.api';

type DocumentScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'DocumentEditor'
>;

const RenderItem = ({
  item,
  navigate,
}: {
  item: Document;
  navigate: (mode: 'view' | 'edit' | 'add') => void;
}) => {
  const { profile } = useAuth();
  const width = Dimensions.get('screen').width;
  const queryClient = useQueryClient();

  queryClient.prefetchQuery({
    queryKey: ['documents', item._id],
    queryFn: () => getDocument(item._id),
    staleTime: 5 * 60 * 1000,
  });

  queryClient.prefetchQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { mutate } = useMutation({
    mutationFn: deleteDocument,
    onMutate: () => {
      showMessage({
        type: 'info',
        message: 'Deleting...',
        description: 'Deleting document, Please wait...',
      });
    },
    meta: {
      invalidateQueries: ['documents'],
    },
  });

  return (
    <Menu
      renderer={renderers.Popover}
      onOpen={() =>
        ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions)
      }
      rendererProps={{
        placement: 'bottom',
        anchorStyle: {
          marginLeft: width * 0.85,
          marginTop: -30,
        },
      }}
      style={{ marginBottom: spacing(16) }}
    >
      <MenuTrigger
        triggerOnLongPress
        onAlternativeAction={() => navigate('view')}
        customStyles={{
          TriggerTouchableComponent: TouchableButton,
          triggerTouchable: {
            activeOpacity: 0.5,
          },
        }}
        disabled={item.user !== profile?._id}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>

        <View style={styles.cardFooter}>
          <AppBadge
            bgColor={item.tag?.color.bg}
            dotColor={item.tag?.color.text}
            text={item.tag?.title}
          />

          <View style={styles.dateRow}>
            <Calendar />
            <Text style={styles.dateText}>
              {moment(item.createdAt).format('D MMM, YYYY')}
            </Text>
          </View>
        </View>
      </MenuTrigger>
      <MenuOptions
        customStyles={{
          optionsContainer: {
            width: scale(100),
            borderRadius: 10,
            paddingVertical: scale(5),
          },
        }}
      >
        <MenuOption style={styles.option} onSelect={() => navigate('edit')}>
          <Pencil color={theme.colors.gray[900]} size={fontSize(16)} />
          <Text style={styles.optionText}>Edit</Text>
        </MenuOption>
        <MenuOption
          value={1}
          style={styles.option}
          onSelect={() =>
            Alert.alert(
              'Delete Document',
              'Are you sure you want to delete this document?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => mutate(item._id),
                },
              ],
            )
          }
        >
          <Octicons name="trash" color="#ef4444" size={fontSize(16)} />
          <Text style={[styles.optionText, { color: '#ef4444' }]}>Delete</Text>
        </MenuOption>
      </MenuOptions>
    </Menu>
  );
};

const RenderContent = ({ activeTab }: { activeTab: string }) => {
  const navigation = useNavigation<DocumentScreenNavigationProp>();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery<PaginatedResponse<Document[]>>({
    queryKey: ['documents', activeTab],
    queryFn: ({ pageParam = 1 }) =>
      getAllDocuments({ tab: activeTab, page: pageParam as number }),
    getNextPageParam: lastPage => {
      const { currentPage, totalPages } = lastPage.meta;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 60 * 1000,
  });

  if (isLoading)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );

  const documents = data?.pages.flatMap(page => page.data) ?? [];
  const isRefreshing =
    !!data && isRefetching && !isFetchingNextPage && !isLoading;

  return (
    <FlatList
      data={documents}
      renderItem={({ item }) => (
        <RenderItem
          item={item}
          navigate={(mode: 'view' | 'edit' | 'add') =>
            navigation.navigate('DocumentEditor', {
              mode,
              documentId: item._id,
            })
          }
        />
      )}
      keyExtractor={item => item._id}
      refreshing={isRefreshing}
      onRefresh={refetch}
      showsVerticalScrollIndicator={false}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={{ paddingVertical: spacing(10), alignItems: 'center' }}>
            <Text
              style={{ color: theme.colors.gray[500], fontSize: fontSize(14) }}
            >
              Loading...
            </Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No documents found.</Text>
        </View>
      }
    />
  );
};

export default function Documents() {
  const navigation = useNavigation<DocumentScreenNavigationProp>();
  const TABS = [
    { key: 'all', label: 'All' },
    { key: 'my-docs', label: 'My Docs' },
    { key: 'shared', label: 'Shared' },
  ];

  return (
    <View style={styles.container}>
      <AppHeader heading="Documents" showSearch />
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing(16),
          marginTop: spacing(6),
        }}
      >
        <AppTabs tabs={TABS} RenderContent={RenderContent} />
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.addBtn}
        onPress={() => navigation.navigate('DocumentEditor', { mode: 'add' })}
      >
        <Ionicons name="add" size={25} color={theme.colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    flex: 1,
    position: 'relative',
  },
  card: {
    backgroundColor: theme.colors.secondary,
    borderRadius: fontSize(12),
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(12),
    shadowColor: theme.colors.gray[400],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    // shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing(16),
  },
  cardTitle: {
    flex: 1,
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(14),
    color: theme.colors.black,
    paddingRight: spacing(8),
  },
  cardFooter: {
    flexDirection: 'row',
    gap: spacing(16),
    alignItems: 'center',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: spacing(6),
    fontSize: fontSize(12),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[800],
  },
  emptyContainer: {
    marginTop: spacing(30),
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.gray[500],
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
  },
  addBtn: {
    position: 'absolute',
    bottom: spacing(16),
    right: spacing(16),
    padding: spacing(10),
    backgroundColor: theme.colors.primary,
    borderRadius: 100,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(10),
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
  },
  optionText: {
    fontSize: fontSize(16),
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
