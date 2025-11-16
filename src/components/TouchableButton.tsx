import React from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  TouchableNativeFeedback,
  TouchableNativeFeedbackProps,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';

type CommonProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

type IOSProps = CommonProps & TouchableOpacityProps;
type AndroidProps = CommonProps & TouchableNativeFeedbackProps;

export type TouchableButtonProps = IOSProps | AndroidProps;

const TouchableButton: React.FC<TouchableButtonProps> = ({
  children,
  style,
  ...rest
}) => {
  if (Platform.OS === 'android') {
    return (
      <View
        style={{
          borderRadius: StyleSheet.flatten(style).borderRadius,
          overflow: 'hidden',
        }}
      >
        <TouchableNativeFeedback useForeground {...(rest as AndroidProps)}>
          {/* TouchableNativeFeedback requires a single View wrapper for styling */}
          <View style={style}>{children}</View>
        </TouchableNativeFeedback>
      </View>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.7} style={style} {...(rest as IOSProps)}>
      {children}
    </TouchableOpacity>
  );
};

export default TouchableButton;
