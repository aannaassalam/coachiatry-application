import { yupResolver } from '@hookform/resolvers/yup';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQueries } from '@tanstack/react-query';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  Text,
  TextInput,
  TextInputKeyPressEvent,
  TouchableOpacity,
  View,
} from 'react-native';
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
import { Feather } from '@react-native-vector-icons/feather';
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
  description: yup.string().required('Description is required'),
  priority: yup.string().required('Priority is required'),
  category: yup.string().required('Category is required'),
  dueDate: yup.date().required('Due date is required'),
  status: yup.string().required('Status is required'),
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
        queryFn: () => getTask(taskId as string),
        enabled: !!taskId,
      },
      {
        queryKey: ['categories'],
        queryFn: getAllCategories,
        enabled: !userId,
      },
      {
        queryKey: ['status'],
        queryFn: getAllStatuses,
        enabled: !userId,
      },
      {
        queryKey: ['categories', userId],
        queryFn: () => getAllCategoriesByCoach(userId as string),
        enabled: !!userId,
      },
      {
        queryKey: ['status', userId],
        queryFn: () => getAllStatusesByCoach(userId as string),
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

  useEffect(() => {
    form.reset({
      title: '',
      description: '',
      priority: 'low',
      category: '',
      dueDate: predefinedDueDate ? new Date(predefinedDueDate) : undefined,
      status: predefinedStatus ?? '',
      frequency: '',
      duration: resetDuration(),
      remindBefore: '',
      subtasks: [],
    });
  }, [predefinedStatus, predefinedDueDate, form]);

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    const h = data.duration?.getHours() ?? 0;
    const m = data.duration?.getMinutes() ?? 0;
    const taskDuration = h * 60 + m;
    const finalData = {
      ...data,
      remindBefore: data.remindBefore ? parseInt(data.remindBefore) : undefined,
      taskDuration,
      frequency:
        data.frequency === '' || !data.frequency ? undefined : data.frequency,
    };
    if (taskId) {
      editMutate({ task_id: taskId, data: finalData });
    } else if (profile?.role === 'coach' && !!userId) {
      coachMutate({ ...finalData, user: userId });
    } else {
      mutate(finalData);
    }
  };

  useEffect(() => {
    if (data && taskId) {
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
      form.reset({
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
      });
    }
  }, [data, form, taskId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableButton
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
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
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" />
        </View>
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
          <View style={styles.buttonInnerContainer}>
            <AppButton
              variant="primary"
              text="Cancel"
              style={{ backgroundColor: '#ECECED', flex: 1 }}
              textStyle={{ color: theme.colors.primary }}
              onPress={navigation.goBack}
              disabled={isEditPending || isPending || isCoachPending}
            />
            <AppButton
              variant="primary"
              text={`${taskId ? 'Edit' : 'Create'} Task`}
              style={{ flex: 1 }}
              onPress={form.handleSubmit(onSubmit, onError)}
              isLoading={isEditPending || isPending || isCoachPending}
            />
          </View>
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
    // paddingBottom: spacing(80),
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
    gap: spacing(10),
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
  },
  optionText: {
    fontSize: fontSize(16),
  },
});
