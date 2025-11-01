import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { createStyleSheet } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import BottomSheetBox from '../ui/BottomSheet';

export default function StatusBox() {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        style={styles.statusOutsideBox('#ff0000', 14)}
        onPress={() => setOpen(true)}
      >
        <View style={styles.statusInsideBox(12)} />
      </Pressable>

      {/* ✅ Portal ensures sheet covers everything including tab bar */}
      <BottomSheetBox open={open} onClose={() => setOpen(false)}>
        <View>
          <Text style={styles.heading}>Status</Text>
          <ScrollView contentContainerStyle={styles.statuses}>
            <Pressable style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
              <Feather name="check" size={fontSize(16)} />
            </Pressable>
            <View style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
            </View>
            <View style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
            </View>
            <View style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
            </View>
            <View style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
            </View>
            <View style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
            </View>
            <View style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
            </View>
            <View style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
            </View>
            <View style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
            </View>
            <View style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
            </View>
            <View style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
            </View>
            <View style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
            </View>
            <View style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
            </View>
            <View style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
            </View>
            <View style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
            </View>
            <View style={styles.status}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(8),
                }}
              >
                <View style={styles.statusOutsideBox('#ff0000', 12)}>
                  <View style={styles.statusInsideBox(10)} />
                </View>
                <Text style={styles.statusText}>Due Date</Text>
              </View>
              <Feather name="check" size={fontSize(16)} />
            </View>
          </ScrollView>
        </View>
      </BottomSheetBox>
    </View>
  );
}

const styles = createStyleSheet({
  statusOutsideBox: (backgroundColor, size) => ({
    width: size ?? 14,
    height: size ?? 14,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor,
  }),
  statusInsideBox: size => ({
    width: size ?? 12,
    height: size ?? 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: theme.colors.white,
  }),
  contentContainer: {
    flex: 1,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(18),
    color: theme.colors.black,
    marginBottom: spacing(20),
  },
  statuses: {
    paddingBottom: spacing(170),
  },
  status: {
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(16),
    color: theme.colors.black,
  },
});
