import {
  createNavigationContainerRef,
  NavigationState,
  NavigationContainer,
  NavigationIndependentTree,
  PartialState,
  Route,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  MessageCircle,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { getAllConversations } from '../../api/functions/chat.api';
import { useFloatingChat } from '../../contexts/FloatingChatContext';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { navigationRef as rootNavigationRef } from '../../navigators/navigationService';
import ChatScreen from '../../screens/Chats/ChatRoom';
import GroupScreen from '../../screens/Chats/GroupScreen';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { ChatConversation } from '../../typescript/interface/chat.interface';
import { fontSize, spacing } from '../../utils';
import FloatingChatList from './FloatingChatList';
import { SmartAvatar } from '../ui/SmartAvatar';

const TAB_BAR_HEIGHT = spacing(70);
const BAR_GAP = spacing(8);

// Space reserved under screens so the last item clears the floating pill
// when scrolled to the bottom (pill ≈ 56px + gap + shadow).
export const FLOATING_BAR_FOOTPRINT = spacing(96);

// Stack routes where the floating bar must stay hidden.
const HIDDEN_STACK_ROUTES = new Set([
  'ChatRoom',
  'CoachChatRoom',
  'GroupScreen',
  'AddEditTask',
  'AddEditUser',
  'Profile',
  'EditProfile',
  'DocumentEditor',
]);

// Bottom-tab routes where the floating bar must stay hidden.
const HIDDEN_TAB_ROUTES = new Set(['Chats']);

const Stack = createNativeStackNavigator<AppStackParamList>();

const floatingNavRef = createNavigationContainerRef<AppStackParamList>();

export default function FloatingChatHost() {
  const { isOpen, open, close, pendingRoomId, consumePendingRoomId } =
    useFloatingChat();
  const { profile } = useAuth();
  const socket = useSocket();
  const insets = useSafeAreaInsets();

  const [onBottomTabs, setOnBottomTabs] = useState(true);
  const [barHidden, setBarHidden] = useState(false);
  const [isFloatingNavReady, setIsFloatingNavReady] = useState(false);
  const [activeFloatingRoute, setActiveFloatingRoute] = useState<
    keyof AppStackParamList
  >('Chats');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [statusByUser, setStatusByUser] = useState<
    Record<string, 'online' | 'offline'>
  >({});
  const [typingByChat, setTypingByChat] = useState<Record<string, boolean>>({});

  const overlayOpacity = useSharedValue(0);
  const overlayTranslate = useSharedValue(20);

  useEffect(() => {
    overlayOpacity.value = withTiming(isOpen ? 1 : 0, { duration: 180 });
    overlayTranslate.value = withTiming(isOpen ? 0 : 20, { duration: 180 });
  }, [isOpen, overlayOpacity, overlayTranslate]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ translateY: overlayTranslate.value }],
  }));

  const { data } = useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam = 1, signal }) =>
      getAllConversations({ page: pageParam, sort: '-updatedAt' }, signal),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const { currentPage, totalPages } = lastPage.meta;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });

  const conversations = useMemo(
    () => data?.pages.flatMap(p => p.data) ?? [],
    [data],
  );

  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }, [conversations]);

  const activeConversation = useMemo(
    () => conversations.find(c => c._id === activeRoomId),
    [conversations, activeRoomId],
  );

  const activeUser =
    activeConversation?.type === 'direct'
      ? activeConversation.members.find(m => m.user._id !== profile?._id)?.user
      : undefined;

  const activeTitle =
    activeConversation?.type === 'group'
      ? activeConversation.name ?? 'Group'
      : activeUser?.fullName ?? 'Conversation';

  const activeSubtitle = (() => {
    if (!activeConversation || !activeRoomId) return 'Tap to view your chats';
    if (typingByChat[activeRoomId]) return 'typing...';
    if (activeConversation.type === 'group') {
      return `${activeConversation.members.length} members`;
    }
    const status = activeUser?._id ? statusByUser[activeUser._id] : undefined;
    if (!status) return 'Offline';
    return status.charAt(0).toUpperCase() + status.slice(1);
  })();

  const getActiveRoute = (
    state?: NavigationState | PartialState<NavigationState>,
  ): Route<string> | undefined => {
    if (!state) return undefined;
    let currentState: NavigationState | PartialState<NavigationState> = state;

    while (currentState) {
      const route = currentState.routes[currentState.index ?? 0] as
        | (Route<string> & {
            state?: NavigationState | PartialState<NavigationState>;
          })
        | undefined;

      if (!route) return undefined;
      if (!route.state) return route;
      currentState = route.state;
    }

    return undefined;
  };

  const syncFloatingRoute = () => {
    if (!floatingNavRef.isReady()) return;
    const root = floatingNavRef.getRootState();
    const active = getActiveRoute(root);
    const name = active?.name as keyof AppStackParamList | undefined;
    const roomId = (active?.params as { roomId?: string } | undefined)?.roomId;

    setActiveFloatingRoute(name ?? 'Chats');
    setActiveRoomId(roomId ?? null);
  };

  useEffect(() => {
    const read = () => {
      if (!rootNavigationRef.isReady()) return;
      const state = rootNavigationRef.getRootState();
      const activeRoute = state?.routes?.[state.index];
      const activeName = activeRoute?.name;

      setOnBottomTabs(activeName === 'BottomTabs');

      if (activeName && HIDDEN_STACK_ROUTES.has(activeName)) {
        setBarHidden(true);
        return;
      }

      if (activeName === 'BottomTabs') {
        const tabState = activeRoute?.state as
          | { index: number; routes: { name: string }[] }
          | undefined;
        const activeTabName = tabState?.routes?.[tabState.index]?.name;
        setBarHidden(!!activeTabName && HIDDEN_TAB_ROUTES.has(activeTabName));
        return;
      }

      setBarHidden(false);
    };

    read();
    const unsub = rootNavigationRef.addListener('state', read);
    return unsub;
  }, []);

  useEffect(() => {
    if (!isOpen || !isFloatingNavReady || !pendingRoomId) return;
    const id = consumePendingRoomId();
    if (!id) return;
    if (floatingNavRef.isReady()) {
      floatingNavRef.navigate('ChatRoom', { roomId: id, fromFloating: true });
    }
  }, [isOpen, isFloatingNavReady, pendingRoomId, consumePendingRoomId]);

  useEffect(() => {
    if (!isFloatingNavReady || !floatingNavRef.isReady()) return;
    syncFloatingRoute();
    const unsub = floatingNavRef.addListener('state', syncFloatingRoute);
    return unsub;
  }, [isFloatingNavReady]);

  useEffect(() => {
    if (!socket) return;

    const onStatusUpdate = ({
      userId,
      status,
    }: {
      userId: string;
      status: 'online' | 'offline';
    }) => {
      setStatusByUser(prev => ({ ...prev, [userId]: status }));
    };

    const onTyping = ({ chatId, userId }: { chatId: string; userId: string }) => {
      if (userId === profile?._id) return;
      setTypingByChat(prev => ({ ...prev, [chatId]: true }));
    };

    const onStopTyping = ({
      chatId,
      userId,
    }: {
      chatId: string;
      userId: string;
    }) => {
      if (userId === profile?._id) return;
      setTypingByChat(prev => ({ ...prev, [chatId]: false }));
    };

    socket.on('user_status_update', onStatusUpdate);
    socket.on('user_typing', onTyping);
    socket.on('user_stop_typing', onStopTyping);

    return () => {
      socket.off('user_status_update', onStatusUpdate);
      socket.off('user_typing', onTyping);
      socket.off('user_stop_typing', onStopTyping);
    };
  }, [socket, profile?._id]);

  return (
    <>
      {!isOpen && !barHidden && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={[
            styles.barWrapper,
            {
              bottom: onBottomTabs
                ? TAB_BAR_HEIGHT + insets.bottom + BAR_GAP
                : Math.max(insets.bottom, BAR_GAP),
            },
          ]}
          pointerEvents="box-none"
        >
          <FloatingChatBar
            onOpen={() => open()}
            totalUnread={totalUnread}
            activeConversation={activeConversation}
            activeTitle={activeTitle}
            activeSubtitle={activeSubtitle}
            isChatFocused={activeFloatingRoute === 'ChatRoom'}
            activeUserPhoto={
              activeConversation?.type === 'group'
                ? activeConversation.groupPhoto
                : activeUser?.photo
            }
          />
        </Animated.View>
      )}

      <Animated.View
        style={[styles.overlay, overlayStyle]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <View
          style={[
            styles.sheet,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            {activeFloatingRoute === 'ChatRoom' ? (
              <TouchableOpacity
                onPress={() => {
                  if (floatingNavRef.isReady()) {
                    floatingNavRef.navigate('Chats');
                  }
                }}
                hitSlop={10}
                style={styles.headerIconBtn}
              >
                <ChevronLeft size={22} color={theme.colors.gray[800]} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerIconBtn} />
            )}

            {activeFloatingRoute === 'ChatRoom' && activeConversation ? (
              <View style={styles.activeHeaderCenter}>
                <SmartAvatar
                  src={
                    activeConversation.type === 'group'
                      ? activeConversation.groupPhoto
                      : activeUser?.photo
                  }
                  name={activeTitle}
                  size={spacing(30)}
                />
                <View style={styles.activeHeaderTextWrap}>
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    {activeTitle}
                  </Text>
                  <Text style={styles.sheetSubtitle} numberOfLines={1}>
                    {activeSubtitle}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.sheetTitle}>Messages</Text>
            )}

            <TouchableOpacity
              onPress={close}
              hitSlop={10}
              style={styles.headerIconBtn}
            >
              <ChevronDown size={22} color={theme.colors.gray[800]} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <NavigationIndependentTree>
              <NavigationContainer
                ref={floatingNavRef}
                onReady={() => {
                  setIsFloatingNavReady(true);
                  syncFloatingRoute();
                }}
              >
                <Stack.Navigator
                  initialRouteName="Chats"
                  screenOptions={{ headerShown: false }}
                >
                  <Stack.Screen name="Chats" component={FloatingChatList} />
                  <Stack.Screen
                    name="ChatRoom"
                    component={ChatScreen}
                    listeners={{
                      gestureStart: () => {
                        // Update header immediately when interactive back swipe starts.
                        setActiveFloatingRoute('Chats');
                        setActiveRoomId(null);
                      },
                      gestureCancel: () => {
                        // Restore the true route if swipe is cancelled.
                        syncFloatingRoute();
                      },
                      gestureEnd: () => {
                        syncFloatingRoute();
                      },
                      transitionStart: e => {
                        // Handles tap-back and other closing transitions.
                        if (e.data?.closing) {
                          setActiveFloatingRoute('Chats');
                          setActiveRoomId(null);
                        }
                      },
                      transitionEnd: () => {
                        syncFloatingRoute();
                      },
                    }}
                  />
                  <Stack.Screen name="GroupScreen" component={GroupScreen} />
                </Stack.Navigator>
              </NavigationContainer>
            </NavigationIndependentTree>
          </View>
        </View>
      </Animated.View>
    </>
  );
}

function FloatingChatBar({
  onOpen,
  totalUnread,
  activeConversation,
  activeTitle,
  activeSubtitle,
  activeUserPhoto,
  isChatFocused,
}: {
  onOpen: () => void;
  totalUnread: number;
  activeConversation?: ChatConversation;
  activeTitle: string;
  activeSubtitle: string;
  activeUserPhoto?: string;
  isChatFocused: boolean;
}) {
  const showFocusedChatSummary = isChatFocused && !!activeConversation;

  return (
    <TouchableOpacity activeOpacity={0.92} style={styles.bar} onPress={onOpen}>
      {showFocusedChatSummary ? (
        <SmartAvatar
          src={activeUserPhoto}
          name={activeTitle}
          size={spacing(36)}
          style={styles.barAvatar}
        />
      ) : (
        <View style={styles.barIcon}>
          <MessageCircle size={18} color={theme.colors.primary} />
        </View>
      )}
      <View style={styles.barText}>
        <Text style={styles.barTitle} numberOfLines={1}>
          {showFocusedChatSummary ? activeTitle : 'Messages'}
        </Text>
        <Text style={styles.barSubtitle} numberOfLines={1}>
          {showFocusedChatSummary
            ? activeSubtitle
            : totalUnread > 0
              ? `${totalUnread > 99 ? '99+' : totalUnread} unread ${totalUnread > 1 ? 'messages' : 'message'}`
              : 'Tap to view your chats'}
        </Text>
      </View>
      {!showFocusedChatSummary && totalUnread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>
            {totalUnread > 99 ? '99+' : totalUnread}
          </Text>
        </View>
      )}
      <View style={styles.barChevron}>
        <ChevronUp size={16} color="rgba(255,255,255,0.85)" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  barWrapper: {
    position: 'absolute',
    left: spacing(14),
    right: spacing(14),
    zIndex: 900,
    elevation: 14,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(10),
    gap: spacing(12),
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  barIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barAvatar: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  barText: {
    flex: 1,
    minWidth: 0,
  },
  barTitle: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.white,
    letterSpacing: 0.2,
  },
  barSubtitle: {
    fontSize: fontSize(11),
    fontFamily: theme.fonts.lato.regular,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: theme.colors.primary,
    fontSize: fontSize(11),
    fontFamily: theme.fonts.archivo.semiBold,
  },
  barChevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing(2),
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 20,
  },
  sheet: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(10),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  sheetTitle: {
    fontSize: fontSize(16),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[900],
  },
  sheetSubtitle: {
    fontSize: fontSize(12),
    color: theme.colors.gray[600],
    fontFamily: theme.fonts.lato.regular,
    marginTop: spacing(1),
  },
  activeHeaderCenter: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(8),
  },
  activeHeaderTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
