'use strict';
// Safe stub for codegen native component schemas incompatible with this dev client.
// Rules:
//   - Must NOT be null: SafeAreaView_INTERNAL_DO_NOT_USE.js does require(...).default
//     which crashes in Hermes with "Cannot convert null value to object".
//   - Must return null (not undefined) to satisfy React's render expectations.
//   - .default must point to the stub so both CJS require(...).default and
//     ES module interop (_interopRequireDefault) work correctly.
function NativeComponentStub() { return null; }
NativeComponentStub.default = NativeComponentStub;
module.exports = NativeComponentStub;
