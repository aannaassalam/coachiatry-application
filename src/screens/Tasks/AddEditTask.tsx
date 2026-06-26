import { yupResolver } from '@hookform/resolvers/yup';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQueries } from '@tanstack/react-query';
import moment from 'moment';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form';
import {
  Alert,
  Dimensions,
  Pressable,
  Text,
  TextInput,
  TextInputKeyPressEvent,
  TouchableOpacity,
  View,
} from 'react-native';
import FormSkeleton from '../../components/skeletons/FormSkeleton';
import { SheetManager } from 'react-native-actions-sheet';
import DatePicker from 'react-native-date-picker';
import { showMessage } from 'react-native-flash-message';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu';
import { createStyleSheet } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';
import * as yup from 'yup';
import { queryClient } from '../../../App';
import {
  getAllCategories,
  getAllCategoriesByCoach,
} from '../../api/functions/category.api';
import {
  getAllStatuses,
  getAllStatusesByCoach,
} from '../../api/functions/status.api';
import {
  addTask,
  addTaskByCoach,
  deleteTask,
  editTask,
  getTask,
} from '../../api/functions/task.api';
import { ChevronLeft } from '../../assets';
import { GeneralPickerSheet } from '../../components/sheets';
import TouchableButton from '../../components/TouchableButton';
import AppButton from '../../components/ui/AppButton';
import Priority from '../../components/ui/Priority';
import { hapticOptions, onError } from '../../helpers/utils';
import { theme } from '../../theme';
import { AppStackParamList } from '../../types/navigation';
import { Subtask } from '../../typescript/interface/task.interface';
import { fontSize, scale, spacing, verticalScale } from '../../utils';
import { useAuth } from '../../hooks/useAuth';

const resetDuration = () => {
  return new Date(
    new Date().getFullYear(), // local year
    0, // Jan (month index 0)
    1, // day 1
    0,
    0,
    0,
    0,
  );
};

const schema = yup.object().shape({
  title: yup.string().required('Title is required'),
  description: yup.string().default(''),
  priority: yup.string().default('low'),
  category: yup.string().default(''),
  dueDate: yup.date().nullable().default(undefined),
  status: yup.string().default(''),
  frequency: yup.string().default(''),
  duration: yup.date().default(resetDuration()),
  remindBefore: yup.string().default(''),
  subtasks: yup
    .array()
    .of(
      yup
        .object()
        .shape({
          title: yup
            .string()
            .required(
              'Please fill in this subtask or delete it if not needed.',
            ),
          completed: yup.boolean().default(false),
        })
        .required(),
    )
    .default([]),
});

// Transform raw form values into the payload the API expects. Shared by the
// explicit submit (create) and the autosave (edit) paths.
const buildTaskPayload = (values: yup.InferType<typeof schema>) => {
  const h = values.duration?.getHours() ?? 0;
  const m = values.duration?.getMinutes() ?? 0;
  const taskDuration = h * 60 + m;
  return {
    ...values,
    remindBefore: values.remindBefore
      ? parseInt(values.remindBefore, 10)
      : undefined,
    taskDuration,
    frequency:
      values.frequency === '' || !values.frequency
        ? undefined
        : values.frequency,
  };
};

const AddSubtasks = ({ disabled }: { disabled?: boolean }) => {
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const { control } = useFormContext();

  const { append, remove, fields } = useFieldArray({
    name: 'subtasks',
    control,
  });

  const handleSubmitFromInput = (index: number) => {
    // only append when this is the last field
    if (index === fields.length - 1 && !disabled) {
      append({ title: '', completed: false });

      // focus the new input after RN renders it
      setTimeout(() => {
        const lastIndex = inputRefs.current.length - 1;
        inputRefs.current[lastIndex]?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: TextInputKeyPressEvent, index: number) => {
    console.log('in');
    if (e.nativeEvent.key === 'Enter' || e.nativeEvent.key === '\n') {
      // no e.preventDefault() in RN
      handleSubmitFromInput(index);
    }
  };

  return (
    <View>
      <Text style={styles.subtaskHeading}>Add Subtask...</Text>
      {fields.length > 0 ? (
        <View style={styles.subtasks}>
          {fields.map((_field, index) => (
            <View style={styles.subtask} key={_field.id}>
              <Controller
                name={`subtasks.${index}.title`}
                control={control}
                render={({ field }) => (
                  <TextInput
                    style={styles.subtaskInput}
                    placeholder={`Subtask ${index + 1}`}
                    placeholderTextColor={theme.colors.gray[500]}
                    {...field}
                    onChangeText={field.onChange}
                    onKeyPress={e => handleKeyDown(e, index)}
                    ref={el => {
                      inputRefs.current[index] = el;
                    }}
                    submitBehavior="blurAndSubmit"
                    returnKeyType="next"
                    onSubmitEditing={() => handleSubmitFromInput(index)}
                  />
                )}
              />
              <Pressable
                style={styles.subtaskRemoveButton}
                onPress={() => remove(index)}
              >
                <Ionicons
                  name="close"
                  size={fontSize(18)}
                  color={theme.colors.gray[700]}
                />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <Pressable
        style={styles.addMore}
        onPress={() => append({ title: '', completed: false })}
      >
        <Ionicons
          name="add"
          size={fontSize(12)}
          color={theme.colors.gray[500]}
        />
        <Text style={styles.addMoreText}>Add More</Text>
      </Pressable>
    </View>
  );
};

export default function AddEditTask() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppStackParamList, 'AddEditTask'>>();
  const { profile } = useAuth();
  const { taskId, predefinedDueDate, predefinedStatus, userId } = route.params;

  const [dateTimePicker, setDateTimePicker] = useState(false);
  const [durationPicker, setDurationPicker] = useState(false);

  // --- Autosave (edit mode) state ---
  const [autosaveStatus, setAutosaveStatus] = useState<
    'idle' | 'saving' | 'saved'
  >('idle');
  const taskLoaded = useRef(false);
  const lastSavedRef = useRef<string>('');
  const latestPayloadRef = useRef<ReturnType<typeof buildTaskPayload> | null>(
    null,
  );
  const pendingSaveRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutate: deleteItem } = useMutation({
    mutationFn: deleteTask,
    onMutate: () => {
      showMessage({
        type: 'info',
        message: 'Deleting...',
        description: 'Deleting task, Please wait...',
      });
    },
    meta: {
      invalidateQueries: ['tasks'],
    },
  });

  const [
    { data, isLoading },
    { data: categories, isLoading: isCategoryLoading },
    { data: statuses, isLoading: isStatusLoading },
    { data: userCategories, isLoading: isUserCategoryLoading },
    { data: userStatuses, isLoading: isUserStatusLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: ['task', taskId],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          getTask(taskId as string, signal),
        enabled: !!taskId,
      },
      {
        queryKey: ['categories'],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          getAllCategories(signal),
        enabled: !userId,
      },
      {
        queryKey: ['status'],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          getAllStatuses(signal),
        enabled: !userId,
      },
      {
        queryKey: ['categories', userId],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          getAllCategoriesByCoach(userId as string, signal),
        enabled: !!userId,
      },
      {
        queryKey: ['status', userId],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          getAllStatusesByCoach(userId as string, signal),
        enabled: !!userId,
      },
    ],
  });

  const { mutate, isPending } = useMutation({
    mutationFn: addTask,
    onSuccess: () => {
      form.reset({
        title: '',
        description: '',
        priority: 'low',
        category: '',
        dueDate: new Date(),
        status: '',
        frequency: '',
        duration: resetDuration(),
        remindBefore: '',
        subtasks: [],
      });
      navigation.goBack();
    },
    meta: {
      invalidateQueries: ['tasks'],
    },
  });

  const { mutate: coachMutate, isPending: isCoachPending } = useMutation({
    mutationFn: addTaskByCoach,
    onSuccess: () => {
      form.reset({
        title: '',
        description: '',
        priority: 'low',
        category: '',
        dueDate: new Date(),
        status: '',
        frequency: '',
        duration: resetDuration(),
        remindBefore: '',
        subtasks: [],
      });
      navigation.goBack();
    },
    meta: {
      invalidateQueries: ['tasks'],
    },
  });

  const { mutate: editMutate, isPending: isEditPending } = useMutation({
    mutationFn: editTask,
    onSuccess: () => {
      form.reset({
        title: '',
        description: '',
        priority: 'low',
        category: '',
        dueDate: new Date(),
        status: '',
        frequency: '',
        duration: resetDuration(),
        remindBefore: '',
        subtasks: [],
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigation.goBack();
    },
    meta: {
      invalidateQueries: ['task', taskId],
    },
  });

  // Silent autosave used while editing — no toast, no navigation.
  const { mutate: autosaveMutate } = useMutation({
    mutationFn: editTask,
    meta: { showToast: false, invalidateQueries: ['tasks'] },
    onSuccess: () => {
      setAutosaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
    onError: () => setAutosaveStatus('idle'),
  });

  const form = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'low',
      category: '',
      dueDate: new Date(),
      status: '',
      frequency: '',
      duration: resetDuration(),
      remindBefore: '',
      subtasks: [],
    },
    disabled: isPending || isEditPending,
  });

  const activeStatuses = userId ? userStatuses : statuses;
  const activeCategories = userId ? userCategories : categories;

  // Apply the default category/status only once, after the lists have first
  // loaded. Re-running on every refetch (e.g. after creating a new category or
  // status) would otherwise wipe the user's selection and any typed input.
  const defaultsApplied = useRef(false);

  useEffect(() => {
    if (taskId) return; // editing — don't overwrite loaded task data
    if (defaultsApplied.current) return;
    if (!activeStatuses || !activeCategories) return; // wait for data

    // Prefer the conventional defaults, but always fall back to the first
    // available option so category & status are prefilled for everyone
    // (own tasks, client tasks, custom setups) — not only when items named
    // exactly "Health"/"To Do" exist.
    const todoStatus = activeStatuses.find(
      s => s.title?.toLowerCase().trim() === 'to do',
    );
    const healthCategory = activeCategories.find(
      c => c.title?.toLowerCase().trim() === 'health',
    );

    defaultsApplied.current = true;

    form.reset({
      title: '',
      description: '',
      priority: 'low',
      category: healthCategory?._id ?? activeCategories[0]?._id ?? '',
      dueDate: predefinedDueDate ? new Date(predefinedDueDate) : undefined,
      status:
        predefinedStatus ?? todoStatus?._id ?? activeStatuses[0]?._id ?? '',
      frequency: '',
      duration: resetDuration(),
      remindBefore: '',
      subtasks: [],
    });
  }, [
    predefinedStatus,
    predefinedDueDate,
    form,
    taskId,
    activeStatuses,
    activeCategories,
  ]);

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    const finalData = buildTaskPayload(data);
    if (taskId) {
      editMutate({ task_id: taskId, data: finalData });
    } else if (profile?.role === 'coach' && !!userId) {
      coachMutate({ ...finalData, user: userId });
    } else {
      mutate(finalData);
    }
  };

  useEffect(() => {
    // Load the task into the form once. Re-running on every refetch (e.g. an
    // autosave invalidation) would clobber in-progress edits.
    if (data && taskId && !taskLoaded.current) {
      taskLoaded.current = true;
      let date = new Date();
      date.setHours(0);
      date.setMinutes(0);
      if (data.taskDuration) {
        const hours = Math.floor(data.taskDuration / 60);
        const mins = data.taskDuration % 60;
        date = new Date();
        date.setHours(hours);
        date.setMinutes(mins);
      }
      const loadedValues = {
        title: data?.title,
        description: data?.description,
        priority: data?.priority,
        category: data?.category._id,
        dueDate: data?.dueDate ? new Date(data?.dueDate) : resetDuration(),
        status: data?.status._id,
        frequency: data?.frequency || '',
        duration: date,
        remindBefore: data?.remindBefore
          ? data?.remindBefore.toString().padStart(2, '0')
          : '',
        subtasks: data?.subtasks as Subtask[],
      };
      // Seed the autosave baseline BEFORE reset so the reset's own change event
      // is recognised as a no-op and doesn't trigger a redundant save on load.
      lastSavedRef.current = JSON.stringify(buildTaskPayload(loadedValues));
      form.reset(loadedValues);
    }
  }, [data, form, taskId]);

  // Debounced autosave while editing. Fires on any change (typing, pickers,
  // subtask edits), skips no-op changes, and won't save while a required field
  // (title, or a half-typed subtask) is empty.
  useEffect(() => {
    if (!taskId) return;
    const subscription = form.watch(values => {
      if (!taskLoaded.current) return;
      const v = values as yup.InferType<typeof schema>;
      if (!v.title?.trim()) return;
      if ((v.subtasks ?? []).some(s => !s?.title?.trim())) return;

      const payload = buildTaskPayload(v);
      const serialized = JSON.stringify(payload);
      if (serialized === lastSavedRef.current) return;

      latestPayloadRef.current = payload;
      pendingSaveRef.current = true;
      setAutosaveStatus('saving');

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        lastSavedRef.current = serialized;
        pendingSaveRef.current = false;
        autosaveMutate({ task_id: taskId, data: payload });
      }, 800);
    });
    return () => subscription.unsubscribe();
  }, [taskId, form, autosaveMutate]);

  // Flush any pending (debounced) save immediately. Idempotent — guarded by
  // pendingSaveRef so it can be called from multiple exit paths without
  // double-saving.
  const flushPendingSave = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (taskId && pendingSaveRef.current && latestPayloadRef.current) {
      pendingSaveRef.current = false;
      lastSavedRef.current = JSON.stringify(latestPayloadRef.current);
      autosaveMutate({ task_id: taskId, data: latestPayloadRef.current });
    }
  }, [taskId, autosaveMutate]);

  // Guarantee the flush before the screen is removed by ANY back path — the
  // header button, the Android hardware back, or the iOS swipe-back gesture.
  // This fires while the screen is still mounted, so the hook mutation runs
  // normally.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      flushPendingSave();
    });
    return unsubscribe;
  }, [navigation, flushPendingSave]);

  // Last-resort safety net: if the screen ever unmounts with a save still
  // pending, fire it with the raw API call so it survives unmount.
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (taskId && pendingSaveRef.current && latestPayloadRef.current) {
        pendingSaveRef.current = false;
        editTask({ task_id: taskId, data: latestPayloadRef.current })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
          })
          .catch(() => {});
      }
    };
  }, [taskId]);

  // Save immediately (skip the debounce) and leave.
  const handleClose = () => {
    flushPendingSave();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableButton style={styles.iconButton} onPress={handleClose}>
          <ChevronLeft />
        </TouchableButton>
        <Text style={styles.headerTitle}>
          {taskId ? 'Edit' : 'Add New'} Task
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {taskId && (
            <Menu
              renderer={renderers.Popover}
              onOpen={() =>
                ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions)
              }
              rendererProps={{
                placement: 'bottom',
              }}
            >
              <MenuTrigger
                customStyles={{
                  TriggerTouchableComponent: TouchableOpacity,
                }}
                style={styles.iconButton}
              >
                {/* <TouchableOpacity style={styles.iconButton}> */}
                <Ionicons
                  name="ellipsis-horizontal"
                  size={fontSize(18)}
                  color={theme.colors.gray[600]}
                />
                {/* </TouchableOpacity> */}
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
                <MenuOption
                  value={1}
                  style={styles.option}
                  onSelect={() =>
                    Alert.alert(
                      'Delete Task',
                      'Are you sure you want to delete this task?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => deleteItem(data?._id ?? ''),
                        },
                      ],
                    )
                  }
                >
                  <Octicons name="trash" color="#ef4444" size={fontSize(16)} />
                  <Text style={[styles.optionText, { color: '#ef4444' }]}>
                    Delete
                  </Text>
                </MenuOption>
              </MenuOptions>
            </Menu>
          )}
        </View>
      </View>
      {isLoading ? (
        <FormSkeleton fields={8} />
      ) : (
        <>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode="on-drag"
            bounces={false}
          >
            <View>
              <Controller
                name="title"
                control={form.control}
                render={({ field }) => (
                  <TextInput
                    style={[styles.transparentInput]}
                    placeholder="Enter title..."
                    placeholderTextColor={theme.colors.black}
                    {...field}
                    onChangeText={field.onChange}
                  />
                )}
              />
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <TextInput
                    style={[
                      styles.transparentInput,
                      {
                        fontSize: fontSize(16),
                        fontFamily: theme.fonts.lato.regular,
                      },
                    ]}
                    placeholder="Add description here..."
                    placeholderTextColor={theme.colors.gray[500]}
                    multiline
                    {...field}
                    onChangeText={field.onChange}
                    textAlignVertical="top"
                  />
                )}
              />
              <FormProvider {...form}>
                <AddSubtasks disabled={isEditPending || isPending} />
              </FormProvider>
            </View>

            <View style={styles.divider} />

            <View>
              <View style={styles.row}>
                <View style={styles.formItem}>
                  <Text style={styles.label}>Priority</Text>
                  <Controller
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <Pressable
                        style={styles.inputContainer}
                        onPress={() =>
                          SheetManager.show('general-sheet', {
                            payload: {
                              children: (
                                <GeneralPickerSheet
                                  heading="Priority"
                                  options={[
                                    { label: 'High', value: 'high' },
                                    { label: 'Medium', value: 'medium' },
                                    { label: 'Low', value: 'low' },
                                  ]}
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              ),
                            },
                          })
                        }
                      >
                        <Priority priority={field.value as any} />
                        <Feather
                          name="chevron-down"
                          size={fontSize(18)}
                          color={'#7F7D83'}
                        />
                      </Pressable>
                    )}
                  />
                </View>
                <View style={styles.formItem}>
                  <Text style={styles.label}>Category</Text>
                  <Controller
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <Pressable
                        style={styles.inputContainer}
                        onPress={() =>
                          SheetManager.show('general-sheet', {
                            payload: {
                              children: (
                                <GeneralPickerSheet
                                  heading="Category"
                                  options={
                                    (profile?.role === 'coach' && !!userId
                                      ? userCategories?.map(_cat => ({
                                          label: _cat.title,
                                          value: _cat._id,
                                        }))
                                      : categories?.map(_cat => ({
                                          label: _cat.title,
                                          value: _cat._id,
                                        }))) ?? []
                                  }
                                  value={field.value}
                                  onChange={field.onChange}
                                  isLoading={isCategoryLoading}
                                  onCreateNew={() => {
                                    const cb = field.onChange;
                                    const uid =
                                      profile?.role === 'coach' && userId
                                        ? userId
                                        : undefined;
                                    SheetManager.hide('general-sheet');
                                    setTimeout(() => {
                                      SheetManager.show(
                                        'create-taxonomy-sheet',
                                        {
                                          payload: {
                                            type: 'category',
                                            userId: uid,
                                            onCreated: cb,
                                          },
                                        },
                                      );
                                    }, 350);
                                  }}
                                />
                              ),
                            },
                          })
                        }
                      >
                        <Text style={styles.inputText} numberOfLines={1}>
                          {(profile?.role === 'coach' && !!userId
                            ? userCategories?.find(
                                _cat => _cat._id === field.value,
                              )?.title
                            : categories?.find(_cat => _cat._id === field.value)
                                ?.title) ?? 'Select'}
                        </Text>
                        <Feather
                          name="chevron-down"
                          size={fontSize(18)}
                          color={'#7F7D83'}
                        />
                      </Pressable>
                    )}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.formItem}>
                  <Text style={styles.label}>Due Date & Time</Text>
                  <Controller
                    name="dueDate"
                    control={form.control}
                    render={({ field }) => (
                      <Pressable
                        style={styles.inputContainer}
                        onPress={() => setDateTimePicker(true)}
                      >
                        <Text
                          style={[styles.inputText, { textTransform: 'none' }]}
                          numberOfLines={1}
                        >
                          {moment(field.value).format('MMM D YYYY, hh:mm a') ===
                          moment().format('MMM D YYYY, hh:mm a')
                            ? 'Select Date and time'
                            : moment(field.value).format('MMM D YYYY, hh:mm a')}
                        </Text>
                        <Ionicons
                          name="calendar-clear-outline"
                          size={fontSize(18)}
                          color={'#7F7D83'}
                        />
                        <DatePicker
                          modal
                          open={dateTimePicker}
                          date={field.value}
                          minimumDate={new Date()}
                          mode="datetime"
                          onConfirm={date => {
                            field.onChange(date);
                            setDateTimePicker(false);
                          }}
                          onCancel={() => setDateTimePicker(false)}
                        />
                      </Pressable>
                    )}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.formItem}>
                  <Text style={styles.label}>Status</Text>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Pressable
                        style={styles.inputContainer}
                        onPress={() =>
                          SheetManager.show('general-sheet', {
                            payload: {
                              children: (
                                <GeneralPickerSheet
                                  heading="Status"
                                  options={
                                    (profile?.role === 'coach' && !!userId
                                      ? userStatuses?.map(_status => ({
                                          label: _status.title,
                                          value: _status._id,
                                        }))
                                      : statuses?.map(_status => ({
                                          label: _status.title,
                                          value: _status._id,
                                        }))) ?? []
                                  }
                                  value={field.value}
                                  onChange={field.onChange}
                                  isLoading={isStatusLoading}
                                  onCreateNew={() => {
                                    const cb = field.onChange;
                                    const uid =
                                      profile?.role === 'coach' && userId
                                        ? userId
                                        : undefined;
                                    SheetManager.hide('general-sheet');
                                    setTimeout(() => {
                                      SheetManager.show(
                                        'create-taxonomy-sheet',
                                        {
                                          payload: {
                                            type: 'status',
                                            userId: uid,
                                            onCreated: cb,
                                          },
                                        },
                                      );
                                    }, 350);
                                  }}
                                />
                              ),
                            },
                          })
                        }
                      >
                        <Text style={styles.inputText} numberOfLines={1}>
                          {(profile?.role === 'coach' && !!userId
                            ? userStatuses?.find(
                                _status => _status._id === field.value,
                              )?.title
                            : statuses?.find(
                                _status => _status._id === field.value,
                              )?.title) ?? 'Select'}
                        </Text>
                        <Feather
                          name="chevron-down"
                          size={fontSize(18)}
                          color={'#7F7D83'}
                        />
                      </Pressable>
                    )}
                  />
                </View>
                <View style={styles.formItem}>
                  <Text style={styles.label}>Task Duration</Text>
                  <Controller
                    name="duration"
                    control={form.control}
                    render={({ field }) => (
                      <Pressable
                        style={styles.inputContainer}
                        onPress={() => setDurationPicker(true)}
                      >
                        <Text style={styles.inputText} numberOfLines={1}>
                          {moment(field.value).format('HH [hours] mm [mins]')}
                        </Text>
                        <Feather
                          name="chevron-down"
                          size={fontSize(18)}
                          color={'#7F7D83'}
                        />
                        <DatePicker
                          modal
                          open={durationPicker}
                          date={field.value}
                          mode="time"
                          locale="en_GB"
                          is24hourSource="locale"
                          onConfirm={date => {
                            field.onChange(date);
                            setDurationPicker(false);
                          }}
                          onCancel={() => setDurationPicker(false)}
                        />
                      </Pressable>
                    )}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.formItem}>
                  <Text style={styles.label}>Frequency</Text>
                  <Controller
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <Pressable
                        style={styles.inputContainer}
                        onPress={() =>
                          SheetManager.show('general-sheet', {
                            payload: {
                              children: (
                                <GeneralPickerSheet
                                  heading="Frequency"
                                  options={[
                                    { label: 'None', value: 'none' },
                                    { label: 'Daily', value: 'daily' },
                                    { label: 'Weekly', value: 'weekly' },
                                    { label: 'Monthly', value: 'monthly' },
                                    { label: 'Yearly', value: 'yearly' },
                                  ]}
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              ),
                            },
                          })
                        }
                      >
                        <Text style={styles.inputText} numberOfLines={1}>
                          {field.value || 'Select'}
                        </Text>
                        <Feather
                          name="chevron-down"
                          size={fontSize(18)}
                          color={'#7F7D83'}
                        />
                      </Pressable>
                    )}
                  />
                </View>
                <View style={styles.formItem}>
                  <Text style={styles.label}>Reminder</Text>
                  <Controller
                    control={form.control}
                    name="remindBefore"
                    render={({ field }) => (
                      <Pressable
                        style={styles.inputContainer}
                        onPress={() =>
                          SheetManager.show('general-sheet', {
                            payload: {
                              children: (
                                <GeneralPickerSheet
                                  heading="Remind before"
                                  options={Array.from(
                                    { length: 60 },
                                    (_, i) => i + 1,
                                  ).map(item => ({
                                    label: item.toString().padStart(2, '0'),
                                    value: item.toString(),
                                  }))}
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              ),
                            },
                          })
                        }
                      >
                        <Text style={styles.inputText} numberOfLines={1}>
                          {field.value ? `${field.value} Mins` : 'Select'}
                        </Text>
                        <Feather
                          name="chevron-down"
                          size={fontSize(18)}
                          color={'#7F7D83'}
                        />
                      </Pressable>
                    )}
                  />
                </View>
              </View>
            </View>
          </KeyboardAwareScrollView>
          {taskId ? (
            <View style={[styles.buttonInnerContainer, styles.editBar]}>
              <View style={styles.autosaveStatus}>
                {autosaveStatus === 'saving' ? (
                  <Text style={styles.autosaveText}>Saving…</Text>
                ) : autosaveStatus === 'saved' ? (
                  <>
                    <Feather name="check" size={fontSize(14)} color="#16A34A" />
                    <Text style={styles.autosaveText}>All changes saved</Text>
                  </>
                ) : null}
              </View>
              <AppButton
                variant="primary"
                text="Done"
                style={{ paddingHorizontal: spacing(32) }}
                onPress={handleClose}
              />
            </View>
          ) : (
            <View style={styles.buttonInnerContainer}>
              <AppButton
                variant="primary"
                text="Cancel"
                style={{ backgroundColor: '#ECECED', flex: 1 }}
                textStyle={{ color: theme.colors.primary }}
                onPress={handleClose}
                disabled={isPending || isCoachPending}
              />
              <AppButton
                variant="primary"
                text="Create Task"
                style={{ flex: 1 }}
                onPress={form.handleSubmit(onSubmit, onError)}
                isLoading={isPending || isCoachPending}
              />
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = createStyleSheet({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    gap: spacing(5),
  },
  iconButton: {
    padding: spacing(4),
    paddingHorizontal: spacing(10),
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[900],
  },
  scrollContent: {
    padding: spacing(20),
    flex: 1,
  },
  transparentInput: {
    fontSize: fontSize(20),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.black,
    //   marginTop: spacing(16),
    paddingVertical: spacing(5),
    // maxHeight: spacing(150),
    // paddingHorizontal: spacing(20),
  },
  subtaskHeading: {
    fontSize: fontSize(15),
    fontFamily: theme.fonts.lato.bold,
    marginTop: spacing(20),
  },
  addMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginTop: spacing(8),
  },
  addMoreText: {
    fontFamily: theme.fonts.lato.bold,
    color: theme.colors.gray[500],
    fontSize: fontSize(12),
  },
  divider: {
    height: verticalScale(8),
    backgroundColor: '#F9F9F9',
    width: Dimensions.get('screen').width,
    marginLeft: spacing(-20),
    marginVertical: spacing(14),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    marginBottom: spacing(12),
  },
  formItem: {
    gap: spacing(8),
    flex: 1,
  },
  label: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(14),
    color: theme.colors.gray[700],
  },
  inputContainer: {
    padding: spacing(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(8),
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: 8,
  },
  inputText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(14),
    color: theme.colors.gray[900],
    // textTransform: 'capitalize',
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    width: Dimensions.get('screen').width,
    marginLeft: spacing(-20),
  },
  buttonInnerContainer: {
    paddingHorizontal: spacing(20),
    paddingVertical: spacing(10),
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing(12),
  },
  editBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autosaveStatus: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
  },
  autosaveText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(12),
    color: theme.colors.gray[500],
  },
  subtasks: {
    marginVertical: spacing(8),
  },
  subtask: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing(4),
    marginBottom: spacing(6),
  },
  subtaskInput: {
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: 8,
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(8),
    flex: 1,
  },
  subtaskRemoveButton: {
    paddingHorizontal: spacing(8),
    alignItems: 'center',
    justifyContent: 'center',
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
});
