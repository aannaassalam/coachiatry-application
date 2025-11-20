// ClientDetailsA1.tsx
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery, useQueries } from '@tanstack/react-query';
import moment from 'moment';
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { createStyleSheet } from 'react-native-unistyles';
import { getAllDocumentsByCoach } from '../../api/functions/document.api';
import { getAllStatusesByCoach } from '../../api/functions/status.api';
import { getAllTasksByCoach } from '../../api/functions/task.api';
import { getUserById } from '../../api/functions/user.api';
import { Calendar, ChevronLeft } from '../../assets';
import TaskCard from '../../components/Tasks/TaskCard';
import TouchableButton from '../../components/TouchableButton';
import AppBadge from '../../components/ui/AppBadge';
import AppButton from '../../components/ui/AppButton';
import { SmartAvatar } from '../../components/ui/SmartAvatar';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { PaginatedResponse } from '../../typescript/interface/common.interface';
import { Document } from '../../typescript/interface/document.interface';
import { Task } from '../../typescript/interface/task.interface';
import { fontSize, scale, spacing } from '../../utils';
import Feather from '@react-native-vector-icons/feather';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MAX_HEADER = SCREEN_HEIGHT * 0.45; // full header visible height
const SMALL_HEADER_HEIGHT = 64; // final sticky small header height (A1)
const TABS_HEIGHT = 52; // measured tabs height (used for placeholders)
const COLLAPSE_DISTANCE = MAX_HEADER - SMALL_HEADER_HEIGHT; // how much to scroll to fully collapse

type Nav = NativeStackNavigationProp<AppStackParamList, 'ClientDetails'>;

const RenderDocument = ({
  item,
  navigate,
}: {
  item: Document;
  navigate: (mode: 'view' | 'edit' | 'add') => void;
}) => {
  return (
    <TouchableButton
      style={documentStyles.card}
      onPress={() => navigate('view')}
    >
      <View style={documentStyles.cardHeader}>
        <Text style={documentStyles.cardTitle}>{item.title}</Text>
      </View>

      <View style={documentStyles.cardFooter}>
        <AppBadge
          bgColor={item.tag?.color.bg}
          dotColor={item.tag?.color.text}
          text={item.tag?.title}
        />

        <View style={documentStyles.dateRow}>
          <Calendar />
          <Text style={documentStyles.dateText}>
            {moment(item.createdAt).format('D MMM, YYYY')}
          </Text>
        </View>
      </View>
    </TouchableButton>
  );
};

export default function ClientDetailsA1() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<AppStackParamList, 'ClientDetails'>>();
  const { userId } = route.params;
  const [activeTab, setActiveTab] = useState<'Tasks' | 'Documents' | 'Chats'>(
    'Documents',
  );

  const [
    { data, isLoading },
    { data: tasks = [], isLoading: isTaskLoading },
    { data: status = [], isLoading: isStatusLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: ['clientDetails', userId],
        queryFn: () => getUserById(userId as string),
      },
      {
        queryKey: ['tasks', userId],
        queryFn: () =>
          getAllTasksByCoach({
            userId: userId as string,
          }),
        placeholderData: (prev: Task[] | undefined) => prev,
        staleTime: 60 * 1000,
      },
      {
        queryKey: ['status', userId],
        queryFn: () => getAllStatusesByCoach(userId as string),
      },
    ],
  });

  const {
    data: documentsData,
    isLoading: isDocumentsLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery<PaginatedResponse<Document[]>>({
    queryKey: ['documents', userId],
    queryFn: ({ pageParam = 1 }) =>
      getAllDocumentsByCoach({
        sort: 'latest',
        tab: 'all',
        userId: userId as string,
        page: pageParam as number,
      }),
    getNextPageParam: lastPage => {
      const { currentPage, totalPages } = lastPage.meta;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 60 * 1000,
  });

  // Animated scroll driver
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  // Small sticky header: slide down into view & fade in
  const smallHeaderStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, COLLAPSE_DISTANCE],
      [-SMALL_HEADER_HEIGHT - 8, 0], // hidden above, then 0
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollY.value,
      [COLLAPSE_DISTANCE * 0.6, COLLAPSE_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }], opacity };
  });

  // Sticky tabs duplicate: fade in when collapsed
  const stickyTabsStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [COLLAPSE_DISTANCE * 0.85, COLLAPSE_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // Avatar transform inside small header (optional small move/scale)
  const smallAvatarStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, COLLAPSE_DISTANCE],
      [0.9, 1],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }] };
  });

  // Title shift in small header
  const smallNameStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollY.value,
      [0, COLLAPSE_DISTANCE],
      [6, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateX }] };
  });

  const isAllLoading =
    isLoading || isDocumentsLoading || isTaskLoading || isStatusLoading;

  const documents = documentsData?.pages.flatMap(page => page.data) ?? [];

  return (
    <View style={styles.container}>
      {/* <StatusBar translucent backgroundColor="transparent" /> */}

      {/* SMALL STICKY HEADER (absolute) - appears when collapsed */}
      <Animated.View style={[styles.smallHeaderContainer, smallHeaderStyle]}>
        <View style={styles.smallHeaderInner}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              paddingHorizontal: spacing(5),
              paddingVertical: spacing(3),
              marginLeft: spacing(4),
            }}
          >
            <ChevronLeft />
          </TouchableOpacity>

          <SmartAvatar
            src={data?.photo}
            size={SMALL_HEADER_HEIGHT - 32}
            name={data?.fullName}
            style={{ marginLeft: spacing(10) }}
            imageStyle={smallAvatarStyle}
          />
          {/* <Animated.Image
            source={require('../../assets/Images/avatar2.png')}
            style={[styles.smallAvatar, smallAvatarStyle]}
          /> */}

          <Animated.View style={[styles.smallTitleBlock, smallNameStyle]}>
            <Text style={styles.smallName}>{data?.fullName}</Text>
          </Animated.View>

          {/* spacer to balance layout */}
          <View style={{ width: 24 }} />
        </View>
      </Animated.View>

      {/* STICKY TABS (absolute) - shown when collapsed; duplicate of tabs below */}
      <Animated.View style={[styles.stickyTabsContainer, stickyTabsStyle]}>
        <View style={styles.tabsInner}>
          {(['Documents', 'Tasks', 'Chats'] as const).map(tab => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.tab}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {tab}
                </Text>
                {isActive && <View style={styles.activeUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* PARENT SCROLL (drives collapse) */}
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing(30), flexGrow: 1 }}
        bounces={false}
        scrollEnabled={!isAllLoading}
        style={{ backgroundColor: theme.colors.white }}
      >
        {/* BIG HEADER (part of scroll content) */}
        <View style={styles.bigHeader}>
          {/* top row: back arrow centered title uses spacing to match small header layout */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                paddingHorizontal: spacing(5),
                paddingVertical: spacing(3),
              }}
            >
              <ChevronLeft />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Client Details</Text>
            <View style={{ width: 24 }} />
          </View>
          {!isAllLoading && (
            <View style={styles.profileCenter}>
              <SmartAvatar
                src={data?.photo}
                name={data?.fullName}
                size={scale(70)}
                style={{ marginBottom: spacing(12) }}
                fontSize={fontSize(36)}
              />
              <Text style={styles.bigName}>{data?.fullName}</Text>
              <Text style={styles.bigEmail}>{data?.email}</Text>

              {/* <View style={styles.extraRow}>
              <View style={styles.infoItem}>
                <User />
                <Text style={styles.text}>{}</Text>
              </View>
              <View style={styles.infoItem}>
                <Date />
                <Text style={styles.text}>21 years</Text>
              </View>
              <View style={styles.infoItem}>
                <MapPin />
                <Text style={styles.text}>New York</Text>
              </View>
            </View> */}

              <View style={styles.buttonRow}>
                <AppButton
                  text="Chat Now"
                  onPress={() => navigation.navigate('Chats')}
                  variant="secondary-outline"
                  style={{
                    flex: 1,
                    padding: spacing(9),
                    borderRadius: fontSize(6),
                  }}
                  textStyle={{ fontSize: fontSize(14) }}
                />
                <AppButton
                  text="View task"
                  onPress={() => setActiveTab('Tasks')}
                  style={{
                    flex: 1,
                    padding: spacing(9),
                    borderRadius: fontSize(6),
                  }}
                  textStyle={{ fontSize: fontSize(14) }}
                />
              </View>
            </View>
          )}
        </View>

        {/* main profile block (centered) */}
        {isAllLoading ? (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <>
            {/* TABS in normal (expanded) state - sits right under big header in scroll flow */}
            <View style={styles.tabsPlaceholder}>
              <View style={styles.tabsInner}>
                {(['Documents', 'Tasks', 'Chats'] as const).map(tab => {
                  const isActive = activeTab === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={styles.tab}
                      onPress={() => setActiveTab(tab)}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          isActive && styles.tabTextActive,
                        ]}
                      >
                        {tab}
                      </Text>
                      {isActive && <View style={styles.activeUnderline} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* TAB CONTENT - lists are NOT scrollable (parent scroll handles it) */}
            <View style={styles.tabContent}>
              {activeTab === 'Tasks' ? (
                <FlatList
                  data={status.sort(
                    (a, b) => (a.priority ?? 0) - (b.priority ?? 0),
                  )}
                  renderItem={({ item, index }) => (
                    <TaskCard
                      status={item}
                      defaultExpanded={index === 0}
                      tasks={tasks.filter(
                        _task => _task.status._id === item._id,
                      )}
                      userId={userId}
                    />
                  )}
                  keyExtractor={item => item._id}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No tasks found.</Text>
                    </View>
                  }
                  scrollEnabled={false}
                  contentContainerStyle={{
                    paddingHorizontal: spacing(5),
                    paddingBottom: spacing(40),
                  }}
                />
              ) : (
                <View>
                  <AppButton
                    text="Add document"
                    leftIcon={
                      <Feather
                        name="plus"
                        color={theme.colors.white}
                        size={fontSize(14)}
                      />
                    }
                    onPress={() =>
                      navigation.navigate('DocumentEditor', {
                        mode: 'add',
                        userId,
                      })
                    }
                    style={{
                      alignSelf: 'flex-end',
                      marginHorizontal: spacing(16),
                      gap: spacing(5),
                    }}
                  />
                  <FlatList
                    data={documents}
                    renderItem={({ item }) => (
                      <RenderDocument
                        item={item}
                        navigate={mode =>
                          navigation.navigate('DocumentEditor', {
                            mode,
                            documentId: item._id,
                            userId,
                          })
                        }
                      />
                    )}
                    keyExtractor={i => i._id}
                    scrollEnabled={false}
                    contentContainerStyle={{
                      padding: spacing(16),
                      paddingBottom: spacing(40),
                    }}
                    showsVerticalScrollIndicator={false}
                    onEndReached={() => {
                      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                    }}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                      isFetchingNextPage ? (
                        <View
                          style={{
                            paddingVertical: spacing(10),
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              color: theme.colors.gray[500],
                              fontSize: fontSize(14),
                            }}
                          >
                            Loading...
                          </Text>
                        </View>
                      ) : null
                    }
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                          No documents found.
                        </Text>
                      </View>
                    }
                  />
                </View>
              )}
            </View>
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.gray[50] },

  /* big header (scroll content) */
  bigHeader: {
    width: '100%',
    backgroundColor: theme.colors.white,
    paddingVertical: spacing(14),
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(16),
    paddingBottom: spacing(30),
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[950],
  },

  profileCenter: {
    alignItems: 'center',
    paddingHorizontal: spacing(16),
  },
  bigName: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[900],
    marginBottom: spacing(4),
  },
  bigEmail: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[600],
    marginBottom: spacing(8),
  },

  extraRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing(12),
    width: '100%',
    paddingHorizontal: spacing(12),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
  },

  buttonRow: {
    flexDirection: 'row',
    gap: spacing(10),
    width: '100%',
    marginTop: spacing(16),
    paddingHorizontal: spacing(16),
  },

  /* tabs placeholder (visible when expanded) */
  tabsPlaceholder: {
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
  tabsInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: TABS_HEIGHT,
    alignItems: 'center',
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabText: {
    fontSize: fontSize(15),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[600],
  },
  tabTextActive: { color: theme.colors.gray[950] },
  activeUnderline: {
    position: 'absolute',
    bottom: spacing(0),
    height: 3,
    width: '75%',
    backgroundColor: theme.colors.gray[950],
    borderRadius: 4,
  },

  tabContent: { backgroundColor: theme.colors.white },

  /* small sticky header (absolute) */
  smallHeaderContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: SMALL_HEADER_HEIGHT,
    zIndex: 40,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  smallHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(12),
    justifyContent: 'space-between',
  },
  smallTitleBlock: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  smallName: {
    fontSize: fontSize(16),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[900],
  },

  /* sticky tabs when collapsed */
  stickyTabsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SMALL_HEADER_HEIGHT,
    height: TABS_HEIGHT,
    zIndex: 39,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },

  /* card styles */
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(12),
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(12),
    marginBottom: spacing(16),
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
    shadowColor: '#00000010',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing(8),
  },
  cardTitle: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[900],
  },
  cardFooter: { marginTop: spacing(8) },
  dateText: { fontSize: fontSize(12), color: theme.colors.gray[600] },

  transCard: {
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(12),
    paddingVertical: spacing(16),
    paddingHorizontal: spacing(12),
    marginBottom: spacing(16),
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
  },
  transTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  transLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(12),
    flex: 1,
  },
  transAvatar: {
    width: fontSize(40),
    height: fontSize(40),
    borderRadius: fontSize(16),
  },
  transTitle: {
    fontSize: fontSize(14),
    color: theme.colors.gray[900],
    fontFamily: theme.fonts.lato.regular,
  },
  transDateRow: {
    flexDirection: 'row',
    marginTop: spacing(8),
    alignItems: 'center',
  },
  transDateText: {
    marginLeft: spacing(6),
    fontSize: fontSize(12),
    color: theme.colors.gray[600],
  },

  text: {
    fontSize: fontSize(14),
    color: theme.colors.gray[700],
    fontFamily: theme.fonts.lato.regular,
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
});

const documentStyles = createStyleSheet({
  card: {
    backgroundColor: theme.colors.secondary,
    borderRadius: fontSize(12),
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(12),
    marginBottom: spacing(16),
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
});
