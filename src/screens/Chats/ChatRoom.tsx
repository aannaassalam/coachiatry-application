import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  LayoutChangeEvent,
  GestureResponderEvent,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EmojiReactor from '../../components/Chat/EmojiReactor';
import { fontSize, spacing } from '../../utils';
import { theme } from '../../theme';
import { assets, ChevronLeft } from '../../assets';
import { useNavigation } from '@react-navigation/native';

const messages = [
  { id: '1', text: 'when will it be ready?', sender: 'other' },
  { id: '2', text: 'Great service.', sender: 'other' },
  { id: '3', text: 'tastes amazing!', sender: 'other' },
  {
    id: '4',
    text: 'Im trying to book an appointment but the assistant isnt picking up the phone. Can I book here?',
    sender: 'me',
  },
  {
    id: '5',
    text: "I'm cautious about crypto. It's unpredictable.",
    sender: 'me',
  },
  {
    id: '6',
    text: 'take a step back and find moments of peace in our hectic lives.',
    sender: 'other',
  },
];

const ChatScreen = () => {
  const [reactorVisible, setReactorVisible] = useState(false);
  const [reactorPos, setReactorPos] = useState({ top: 0, left: 0 });
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null);

  const handleLongPress = (event: GestureResponderEvent, id: string) => {
    const { pageX, pageY } = event.nativeEvent;
    setSelectedMsg(id);
    setReactorPos({ top: pageY - 80, left: pageX });
    setReactorVisible(true);
  };

  const handleEmojiSelect = (emoji: string) => {
    console.log(`Reacted to ${selectedMsg} with emoji: ${emoji}`);
    setReactorVisible(false);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender === 'me';
    return (
      <View
        style={[
          styles.messageRow,
          { justifyContent: isMe ? 'flex-end' : 'flex-start' },
        ]}
      >
        {!isMe && (
          <Image source={assets.images.Avatar2} style={styles.avatar} />
        )}
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={e => handleLongPress(e, item.id)}
          style={[
            styles.messageBubble,
            isMe ? styles.myMessage : styles.otherMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isMe ? theme.colors.white : theme.colors.gray[900] },
            ]}
          >
            {item.text}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <ChevronLeft />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <Image source={assets.images.Avatar2} style={styles.userAvatar} />
          <Text style={styles.userName}>Robert Fox</Text>
          <View style={styles.dot} />
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: spacing(16), gap: spacing(10) }}
      />

      {/* Message Input */}
      <View style={styles.inputBar}>
        <View style={styles.inputContainer}>
          <Ionicons
            name="happy-outline"
            size={18}
            color={theme.colors.gray[500]}
          />
          <TextInput
            placeholder="Write your message..."
            placeholderTextColor={theme.colors.gray[400]}
            style={styles.input}
          />
          <Ionicons
            name="attach-outline"
            size={18}
            color={theme.colors.gray[500]}
          />
          <Ionicons
            name="time-outline"
            size={18}
            color={theme.colors.gray[500]}
          />
          <Ionicons
            name="sparkles-outline"
            size={18}
            color={theme.colors.gray[500]}
          />
        </View>
      </View>

      {/* Emoji Reactor */}
      {reactorVisible && (
        <EmojiReactor
          position={reactorPos}
          onSelect={handleEmojiSelect}
          onDismiss={() => setReactorVisible(false)}
        />
      )}
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(8),
  },
  userAvatar: {
    width: fontSize(28),
    height: fontSize(28),
    borderRadius: fontSize(14),
  },
  userName: {
    fontSize: fontSize(15),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[900],
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatar: {
    width: fontSize(28),
    height: fontSize(28),
    borderRadius: fontSize(14),
    marginRight: spacing(8),
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(10),
    borderRadius: fontSize(12),
  },
  myMessage: {
    backgroundColor: theme.colors.gray[950],
    borderBottomRightRadius: fontSize(4),
  },
  otherMessage: {
    backgroundColor: theme.colors.gray[100],
    borderBottomLeftRadius: fontSize(4),
  },
  messageText: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
  },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    padding: spacing(8),
    backgroundColor: theme.colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[50],
    borderRadius: fontSize(20),
    paddingHorizontal: spacing(12),
    gap: spacing(8),
  },
  input: {
    flex: 1,
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[900],
  },
});
