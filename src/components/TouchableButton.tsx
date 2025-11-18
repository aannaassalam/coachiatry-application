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
    const { flex, ...extractedStyles } = StyleSheet.flatten(style) ?? {
      flex: 0,
    };

    return (
      <View
        style={{
          borderRadius: extractedStyles?.borderRadius ?? 0,
          flex,
          overflow: 'hidden',
        }}
      >
        <TouchableNativeFeedback useForeground {...(rest as AndroidProps)}>
          {/* TouchableNativeFeedback requires a single View wrapper for styling */}
          <View style={extractedStyles}>{children}</View>
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
