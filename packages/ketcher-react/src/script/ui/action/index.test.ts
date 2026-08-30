import action from './index';
jest.mock('./atoms', () => ({}));
jest.mock('./copyAs', () => jest.fn());
jest.mock('./copyImageToClipboard', () => jest.fn());
jest.mock('./debug', () => ({}));
jest.mock('../component/cliparea/cliparea', () => ({
  exec: jest.fn(),
}));
jest.mock('./isHidden', () => jest.fn(() => false));
jest.mock('./server', () => ({}));
jest.mock('./templates', () => ({}));
jest.mock('./tools', () => ({}));
jest.mock('./zoom', () => ({}));
jest.mock('./help', () => ({
  __esModule: true,
  default: {
    help: {
      enabledInViewOnly: true,
      action: jest.fn(),
      hidden: jest.fn(() => false),
    },
  },
}));
jest.mock('./functionalGroups', () => ({}));
jest.mock('../state/shared', () => ({
  openInfoModal: jest.fn(),
  removeStructAction: jest.fn(),
}));

describe('toolbar action state for monomer creation wizard', () => {
  it('keeps help and about enabled while the wizard is active', () => {
    expect(action.help.disabled).toBeUndefined();
    expect(action.about.disabled).toBeUndefined();
  });
});
