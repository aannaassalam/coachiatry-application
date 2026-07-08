import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import ActionSheet, {
  SheetManager,
  SheetProps,
} from 'react-native-actions-sheet';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
import * as yup from 'yup';
import { createUser } from '../api/functions/user.api';
import { onError } from '../helpers/utils';
import { theme } from '../theme';
import { fontSize, spacing } from '../utils';
import AppButton from './ui/AppButton';
import AppInput from './ui/AppInput';

const SHEET_ID = 'create-client-sheet';

const schema = yup.object().shape({
  name: yup.string().trim().required('Name is required'),
  email: yup
    .string()
    .trim()
    .email('Enter a valid email')
    .required('Email is required'),
});

type FormValues = yup.InferType<typeof schema>;

export default function CreateClientSheet(
  _props: SheetProps<'create-client-sheet'>,
) {
  const { styles } = useStyles(stylesheet);

  const form = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { name: '', email: '' },
  });

  const { mutate, isPending } = useMutation({
    // Role is always "user"; the backend auto-assigns the new client to the
    // requesting coach and emails them an auto-generated password.
    mutationFn: (values: FormValues) =>
      createUser({ name: values.name, email: values.email, role: 'user' }),
    onSuccess: () => {
      form.reset();
      SheetManager.hide(SHEET_ID);
    },
    meta: {
      invalidateQueries: ['clients'],
    },
  });

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
      <FormProvider {...form}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Add a new client</Text>
            <Pressable
              style={styles.closeButton}
              hitSlop={spacing(8)}
              disabled={isPending}
              onPress={() => SheetManager.hide(SHEET_ID)}
            >
              <Feather
                name="x"
                size={fontSize(20)}
                color={theme.colors.gray[500]}
              />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            They&apos;ll be added under you and emailed a login with an
            auto-generated password.
          </Text>

          <AppInput
            label="Name"
            name="name"
            placeholder="Enter full name"
            disabled={isPending}
          />
          <AppInput
            label="Email"
            name="email"
            placeholder="Enter email address"
            keyboardType="email-address"
            disabled={isPending}
          />

          <AppButton
            text="Add client"
            onPress={form.handleSubmit(values => mutate(values), onError)}
            isLoading={isPending}
            style={styles.submitButton}
          />
        </View>
      </FormProvider>
    </ActionSheet>
  );
}

const stylesheet = createStyleSheet({
  container: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#f9f9f9',
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
  subtitle: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[500],
    marginTop: -spacing(6),
  },
  closeButton: {
    padding: spacing(2),
  },
  submitButton: {
    paddingVertical: spacing(14),
    marginTop: spacing(4),
  },
});
