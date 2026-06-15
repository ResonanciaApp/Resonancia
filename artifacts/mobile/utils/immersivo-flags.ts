let _reopenMixer = false;

export const setReopenMixer = (v: boolean) => {
  _reopenMixer = v;
};

export const consumeReopenMixer = (): boolean => {
  const v = _reopenMixer;
  _reopenMixer = false;
  return v;
};
