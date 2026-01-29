import React from 'react';
import { ChatConversation } from '../../typescript/interface/chat.interface';
import { useAuth } from '../../hooks/useAuth';
import TouchableButton from '../TouchableButton';
import { SmartAvatar } from '../ui/SmartAvatar';
import { Text, View } from 'react-native';
import { theme } from '../../theme';
import moment from 'moment';
import { createStyleSheet } from 'react-native-unistyles';
import { fontSize, scale, spacing } from '../../utils';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../types/navigation';
import { useNavigation } from '@react-navigation/native';

type ChatScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'ChatRoom'
>;

export default function ChatMessage({ item }: { item: ChatConversation }) {
  const { profile } = useAuth();
  const navigation = useNavigation<ChatScreenNavigationProp>();

  const chatUser = item.members.find(
    _member => _member.user._id !== profile?._id,
  );
  const details: { photo?: string; name?: string } = {
    photo: chatUser?.user.photo,
    name: chatUser?.user.fullName,
  };

  if (item && item.type === 'group') {
    details.photo = item.groupPhoto;
    details.name = item.name;
  }

  return (
    <TouchableButton
      onPress={() => {
        // handle onPress
        navigation.navigate('ChatRoom', { roomId: item._id! });
      }}
      style={styles.card}
    >
      <SmartAvatar
        src={details.photo}
        name={details.name}
        size={scale(40)}
        fontSize={fontSize(18)}
      />

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{details.name}</Text>

        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          style={[
            styles.cardContent,
            item.unreadCount > 0 && {
              fontFamily: theme.fonts.archivo.semiBold,
              color: theme.colors.gray[600],
            },
          ]}
        >
          {item.lastMessage?.sender?._id === profile?._id && item.isDeletable
            ? 'You: '
            : null}
          {item.lastMessage?.content ||
            (item.lastMessage?.type === 'image'
              ? '📷 Images'
              : item.lastMessage?.type === 'video'
                ? '🎥 Videos'
                : item.lastMessage?.type === 'file'
                  ? '📁 Files'
                  : undefined)}
        </Text>
      </View>

      <View style={styles.meta}>
        <Text
          style={[
            styles.time,
            item.unreadCount > 0 && {
              fontFamily: theme.fonts.archivo.semiBold,
            },
          ]}
        >
          {item.lastMessage?.createdAt
            ? moment(item.lastMessage?.createdAt).fromNow(true)
            : moment(item?.createdAt).fromNow(true)}
        </Text>

        {item.unreadCount > 0 && (
          <View style={styles.unreadCount}>
            <Text style={styles.unreadCountText}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableButton>
  );
}

const styles = createStyleSheet({
  card: {
    // height: 66,
    // paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(10),
    gap: spacing(12),
    // justifyContent: 'flex-start',
  },
  cardImg: {
    width: 40,
    height: 40,
    borderRadius: 9999,
  },
  cardBody: {
    // maxWidth: '100%',
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.semiBold,
    color: '#222',
    lineHeight: 20,
  },
  cardContent: {
    fontSize: 15,
    fontFamily: theme.fonts.archivo.medium,
    color: '#808080',
    lineHeight: 20,
    marginTop: spacing(3),
  },
  meta: {
    flexDirection: 'column',
    gap: spacing(8),
    alignItems: 'flex-end',
  },
  time: {
    color: theme.colors.gray[500],
    fontSize: fontSize(12),
    fontFamily: theme.fonts.archivo.medium,
  },
  unreadCount: {
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(2),
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  unreadCountText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.archivo.medium,
  },
});
