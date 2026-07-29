import { useMutation } from '@tanstack/react-query';
import moment from 'moment';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import ActionSheet, {
  SheetManager,
  SheetProps,
} from 'react-native-actions-sheet';
import DatePicker from 'react-native-date-picker';
import { showMessage } from 'react-native-flash-message';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { queryClient } from '../../../App';
import {
  editScheduleMessage,
  scheduleMessage,
} from '../../api/functions/message.api';
import { navigate } from '../../navigators/navigationService';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import AppButton from '../ui/AppButton';

const SHEET_ID = 'schedule-message-sheet';

// Values map to the backend `repeat` enum. A one-time send is 'once'; older
// rows stored it as 'none', which the backend now normalizes on write.
const FREQUENCIES = [
  { label: 'Once', value: 'once' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

export default function ScheduleMessageSheet(
  props: SheetProps<'schedule-message-sheet'>,
) {
  const { styles } = useStyles(stylesheet);
  const payload = props.payload;
  const editing = !!payload?.selectedMessage;

  const [message, setMessage] = useState(
    editing ? payload!.selectedMessage!.content : (payload?.message ?? ''),
  );
  const [date, setDate] = useState<Date>(() => {
    if (editing) return new Date(payload!.selectedMessage!.scheduledAt);
    // Default to the next full hour, at least a few minutes out.
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  });
  // Defaults to "Once" (one-time). Editing keeps the message's existing repeat,
  // mapping legacy 'none' rows onto the 'once' pill so one is always selected.
  const [frequency, setFrequency] = useState(() => {
    const stored = editing ? payload!.selectedMessage!.repeat : '';
    return !stored || stored === 'none' ? 'once' : stored;
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: scheduleMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['scheduled-messages'],
        refetchType: 'all',
      });
      showMessage({ type: 'success', message: 'Message scheduled' });
      SheetManager.hide(SHEET_ID);
    },
    onError: () =>
      showMessage({ type: 'danger', message: 'Could not schedule message' }),
  });

  const { mutate: edit, isPending: isEditing } = useMutation({
    mutationFn: editScheduleMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['scheduled-messages'],
        refetchType: 'all',
      });
      showMessage({ type: 'success', message: 'Scheduled message updated' });
      SheetManager.hide(SHEET_ID);
    },
    onError: () =>
      showMessage({ type: 'danger', message: 'Could not update message' }),
  });

  const isPending = isCreating || isEditing;

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      showMessage({ type: 'warning', message: 'Message is required' });
      return;
    }
    if (!frequency) {
      showMessage({
        type: 'warning',
        message: 'Please select a frequency (choose "Once" for a one-time send)',
      });
      return;
    }
    if (date.getTime() <= Date.now()) {
      showMessage({
        type: 'warning',
        message: 'Pick a time in the future',
      });
      return;
    }
    const scheduledAt = date.toISOString();
    if (editing) {
      edit({
        messageId: payload!.selectedMessage!._id,
        message: trimmed,
        scheduledAt,
        frequency,
      });
    } else {
      create({
        message: trimmed,
        scheduledAt,
        frequency,
        chatId: payload!.chatId,
      });
    }
  };

  return (
    <ActionSheet
      id={SHEET_ID}
      useBottomSafeAreaPadding
      closeOnTouchBackdrop={!isPending}
      indicatorStyle={{ display: 'none' }}
      gestureEnabled={!isPending}
      drawUnderStatusBar={false}
      containerStyle={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Schedule Message</Text>
          <Pressable
            hitSlop={spacing(8)}
            disabled={isPending}
            onPress={() => SheetManager.hide(SHEET_ID)}
          >
            <Feather name="x" size={fontSize(20)} color={theme.colors.gray[500]} />
          </Pressable>
        </View>

        <View>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            multiline
            editable={!isPending}
            placeholder="Type your message..."
            placeholderTextColor={theme.colors.gray[400]}
            textAlignVertical="top"
          />
        </View>

        <View>
          <Text style={styles.label}>Date</Text>
          <Pressable
            style={styles.field}
            onPress={() => setDatePickerOpen(true)}
            disabled={isPending}
          >
            <Text style={styles.fieldText}>
              {moment(date).format('MMM DD, YYYY')}
            </Text>
            <Ionicons
              name="calendar-clear-outline"
              size={fontSize(18)}
              color={theme.colors.gray[500]}
            />
          </Pressable>
        </View>

        <View>
          <Text style={styles.label}>Time</Text>
          <Pressable
            style={styles.field}
            onPress={() => setTimePickerOpen(true)}
            disabled={isPending}
          >
            <Text style={styles.fieldText}>{moment(date).format('hh:mm A')}</Text>
            <Ionicons
              name="chevron-down"
              size={fontSize(18)}
              color={theme.colors.gray[500]}
            />
          </Pressable>
        </View>

        <View>
          <Text style={styles.label}>
            Repeat <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.pillRow}>
            {FREQUENCIES.map(f => {
              const active = frequency === f.value;
              return (
                <Pressable
                  key={f.label}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setFrequency(f.value)}
                  disabled={isPending}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.noteRow}>
          <Ionicons
            name="alert-circle-outline"
            size={fontSize(16)}
            color={theme.colors.gray[500]}
          />
          <Text style={styles.noteText}>
            This message will be sent automatically to{' '}
            <Text style={styles.noteStrong}>
              {payload?.receiverName || 'the recipient'}
            </Text>{' '}
            at the selected time.
          </Text>
        </View>

        <View style={styles.buttonRow}>
          {!editing && (
            <AppButton
              text="View All Schedule"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => {
                SheetManager.hide(SHEET_ID);
                navigate('ScheduledMessages');
              }}
              disabled={isPending}
            />
          )}
          <AppButton
            text={editing ? 'Update' : 'Create'}
            style={{ flex: 1 }}
            onPress={handleSubmit}
            isLoading={isPending}
          />
        </View>
      </ScrollView>

      <DatePicker
        modal
        mode="date"
        open={datePickerOpen}
        date={date}
        minimumDate={new Date()}
        onConfirm={picked => {
          // Keep the chosen time, change only the calendar date.
          const next = new Date(date);
          next.setFullYear(
            picked.getFullYear(),
            picked.getMonth(),
            picked.getDate(),
          );
          setDate(next);
          setDatePickerOpen(false);
        }}
        onCancel={() => setDatePickerOpen(false)}
      />
      <DatePicker
        modal
        mode="time"
        open={timePickerOpen}
        date={date}
        onConfirm={picked => {
          const next = new Date(date);
          next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
          setDate(next);
          setTimePickerOpen(false);
        }}
        onCancel={() => setTimePickerOpen(false)}
      />
    </ActionSheet>
  );
}

const stylesheet = createStyleSheet({
  container: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#fff',
    maxHeight: '90%',
  },
  content: {
    padding: spacing(20),
    paddingTop: spacing(24),
    gap: spacing(16),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(18),
    color: theme.colors.gray[950],
  },
  label: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[600],
    marginBottom: spacing(8),
  },
  required: {
    color: '#ef4444',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: fontSize(10),
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(14),
    fontSize: fontSize(14),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[900],
    minHeight: spacing(72),
    maxHeight: spacing(140),
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: fontSize(10),
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(14),
  },
  fieldText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(14),
    color: theme.colors.gray[900],
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(8),
  },
  pill: {
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(14),
    borderRadius: 100,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    backgroundColor: theme.colors.white,
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pillText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[700],
  },
  pillTextActive: {
    color: theme.colors.white,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(8),
    backgroundColor: theme.colors.gray[100],
    borderRadius: fontSize(10),
    padding: spacing(12),
  },
  noteText: {
    flex: 1,
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(12),
    color: theme.colors.gray[600],
    lineHeight: fontSize(18),
  },
  noteStrong: {
    fontFamily: theme.fonts.lato.bold,
    color: theme.colors.gray[800],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing(12),
    marginTop: spacing(4),
  },
});
