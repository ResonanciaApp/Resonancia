// Workaround: RN 0.86 codegen can't parse nested Readonly<{}> in VirtualViewExperimental.
// We bypass codegenNativeComponent and use requireNativeComponent directly.
import { requireNativeComponent } from 'react-native';
export default requireNativeComponent('VirtualViewExperimental');
