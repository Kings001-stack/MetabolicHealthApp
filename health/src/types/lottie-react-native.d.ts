declare module 'lottie-react-native' {
  import * as React from 'react';
  import { ViewStyle, StyleProp } from 'react-native';

  export interface LottieViewProps {
    source: any;
    autoPlay?: boolean;
    loop?: boolean;
    style?: StyleProp<ViewStyle>;
    onAnimationFinish?: () => void;
  }

  export default class LottieView extends React.Component<LottieViewProps> {}
}
